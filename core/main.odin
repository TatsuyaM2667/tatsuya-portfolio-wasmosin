package main

import "core:math"

// ─── 解像度定義 ────────────────────────────────────────────────────────────
// CSS 側でフルスクリーンに拡大するため内部解像度は控えめに保つ
WIDTH :: 512
HEIGHT :: 384
NOISE_DIM :: 64 // 2のべき乗である必要がある

// JS 側が解像度を問い合わせられるようにエクスポート
// (Odin側の定数を単一の真実の情報源にする)
@(export)
get_width :: proc "contextless" () -> i32 {return WIDTH}

@(export)
get_height :: proc "contextless" () -> i32 {return HEIGHT}

// ─── 高速三角関数 ──────────────────────────────────────────────────────────
// freestanding_wasm32 では core:math の sin/cos は外部関数 (env.sinf/env.cosf)
// に依存し、ピクセル毎に呼ぶとFFI境界のオーバーヘッドで大きく重くなる。
// ここでは自己完結のポリノミアル近似 (最大誤差 ~0.001) を使い、
// ホスト関数への依存を完全に無くして軽量化する。
fast_sin :: proc "contextless" (x: f32) -> f32 {
	PI :: 3.14159265358979
	TAU :: 6.28318530717958
	xr := x - TAU * math.floor((x + PI) * (1.0 / TAU))
	B :: 4.0 / PI
	C :: -4.0 / (PI * PI)
	ay := xr < 0 ? -xr : xr
	y := B * xr + C * xr * ay
	P :: 0.225
	ay = y < 0 ? -y : y
	return P * (y * ay - y) + y
}

fast_cos :: proc "contextless" (x: f32) -> f32 {
	PI :: 3.14159265358979
	return fast_sin(x + PI * 0.5)
}

// ─── 共有バッファ ──────────────────────────────────────────────────────────
pixel_buffer: [WIDTH * HEIGHT * 4]u8
noise_tex: [NOISE_DIM * NOISE_DIM]f32

// JS 側にバッファ先頭ポインタを渡す
@(export)
get_buffer_ptr :: proc "contextless" () -> ^u8 {
	return &pixel_buffer[0]
}

// ─── ユーティリティ ────────────────────────────────────────────────────────

lerp :: proc "contextless" (a, b, t: f32) -> f32 {
	return a + (b - a) * t
}

mix3 :: proc "contextless" (a, b: [3]f32, t: f32) -> [3]f32 {
	return [3]f32{lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)}
}

clamp01 :: proc "contextless" (v: f32) -> f32 {
	if v < 0.0 do return 0.0
	if v > 1.0 do return 1.0
	return v
}

smoothstep :: proc "contextless" (edge0, edge1, x: f32) -> f32 {
	t := clamp01((x - edge0) / (edge1 - edge0))
	return t * t * (3.0 - 2.0 * t)
}

frac1 :: proc "contextless" (x: f32) -> f32 {
	return x - math.floor(x)
}

// ─── ノイズテクスチャ ──────────────────────────────────────────────────────

_hash :: proc "contextless" (px, py: i32) -> f32 {
	n := u32(px * 157 + py * 113)
	n = (n << 13) ~ n
	n = n * (n * n * 15731 + 789221) + 1376312589
	n = n & 0x7fffffff
	return f32(n) / f32(0x7fffffff)
}

@(export)
init_noise :: proc "contextless" () {
	for y in 0 ..< NOISE_DIM {
		for x in 0 ..< NOISE_DIM {
			noise_tex[y * NOISE_DIM + x] = _hash(i32(x), i32(y))
		}
	}
}

// バイリニア補間付きノイズサンプラ
sample_noise :: proc "contextless" (x, y: f32) -> f32 {
	ix := i32(math.floor(x))
	iy := i32(math.floor(y))
	fx := x - f32(ix)
	fy := y - f32(iy)
	sx := fx * fx * (3.0 - 2.0 * fx) // スムーズステップ
	sy := fy * fy * (3.0 - 2.0 * fy)
	mask: i32 = NOISE_DIM - 1

	ix = ix & mask
	iy = iy & mask
	ix1 := (ix + 1) & mask
	iy1 := (iy + 1) & mask

	v00 := noise_tex[iy * NOISE_DIM + ix]
	v10 := noise_tex[iy * NOISE_DIM + ix1]
	v01 := noise_tex[iy1 * NOISE_DIM + ix]
	v11 := noise_tex[iy1 * NOISE_DIM + ix1]
	return v00 + (v10 - v00) * sx + ((v01 - v00) + (v00 - v10 - v01 + v11) * sx) * sy
}

// フラクタル・ブラウン運動（多オクターブノイズ）
fbm :: proc "contextless" (x, y: f32, octaves: i32) -> f32 {
	v: f32 = 0.0
	amp: f32 = 0.5
	freq: f32 = 1.0
	m: f32 = 0.0
	for _ in 0 ..< octaves {
		v += amp * sample_noise(x * freq, y * freq)
		m += amp
		amp *= 0.5
		freq *= 2.0
	}
	return v / m
}

// ─── 一日の色パレット（キーフレーム方式） ──────────────────────────────────
// 単純な2色ブレンドではなく、夜明け前・日の出・朝・正午・夕方・日没・夜明け前…と
// 複数のキーフレームを持たせることで、朝昼晩それぞれの段階がはっきり感じられる
// ようにする。sun_k=太陽の輝き強度 / star_k=星空の見え方 / vivid_k=地平線の彩度・コントラスト
Keyframe :: struct {
	phase:   f32,
	zenith:  [3]f32,
	horizon: [3]f32,
	sun_k:   f32,
	star_k:  f32,
	vivid_k: f32,
}

DAY_KEYFRAMES := [8]Keyframe {
	{0.00, {6, 8, 22}, {14, 16, 34}, 0.0, 1.00, 0.08}, // 深夜
	{0.14, {10, 14, 40}, {40, 30, 58}, 0.05, 0.75, 0.30}, // 夜明け前
	{0.24, {40, 55, 118}, {255, 130, 80}, 1.0, 0.05, 1.00}, // 日の出
	{0.36, {35, 118, 205}, {200, 222, 245}, 0.85, 0.0, 0.18}, // 朝
	{0.50, {40, 130, 228}, {206, 232, 253}, 1.0, 0.0, 0.0}, // 正午
	{0.64, {35, 118, 205}, {205, 205, 220}, 0.85, 0.0, 0.22}, // 夕方前
	{0.76, {35, 50, 110}, {255, 110, 70}, 1.0, 0.05, 1.00}, // 日没
	{0.88, {10, 14, 40}, {45, 32, 58}, 0.05, 0.75, 0.32}, // 夜の始まり
}

sample_sky_palette :: proc "contextless" (
	phase: f32,
) -> (
	zenith: [3]f32,
	horizon: [3]f32,
	sun_k: f32,
	star_k: f32,
	vivid_k: f32,
) {
	N :: len(DAY_KEYFRAMES)
	for i in 0 ..< N {
		a := DAY_KEYFRAMES[i]
		b := DAY_KEYFRAMES[(i + 1) % N]
		b_phase := i == N - 1 ? 1.0 : b.phase
		if phase >= a.phase && phase < b_phase {
			t := smoothstep(0.0, 1.0, (phase - a.phase) / (b_phase - a.phase))
			zenith = mix3(a.zenith, b.zenith, t)
			horizon = mix3(a.horizon, b.horizon, t)
			sun_k = lerp(a.sun_k, b.sun_k, t)
			star_k = lerp(a.star_k, b.star_k, t)
			vivid_k = lerp(a.vivid_k, b.vivid_k, t)
			return
		}
	}
	last := DAY_KEYFRAMES[N - 1]
	zenith = last.zenith
	horizon = last.horizon
	sun_k = last.sun_k
	star_k = last.star_k
	vivid_k = last.vivid_k
	return
}

// 一日の長さ（秒）。ゆっくり進める方が「サイクル感」を感じやすい
DAY_LENGTH :: 480.0
ARC_START :: 0.18 // このphaseで太陽が地平線から昇り始める
ARC_END :: 0.82 // このphaseで太陽が沈み切る

// ─── メインレンダラ ────────────────────────────────────────────────────────
// time: 経過秒数（JS の requestAnimationFrame timestamp / 1000）
@(export)
render_frame :: proc "contextless" (time: f32) {
	PI :: 3.14159265358979

	phase := frac1(time / DAY_LENGTH)
	zenith, horizon_col, sun_k, star_k, vivid_k := sample_sky_palette(phase)

	// 太陽の位置（東から西へ弧を描いて移動）。ARC範囲外は地平線の下＝夜
	day_progress := (phase - ARC_START) / (ARC_END - ARC_START)
	sun_above := day_progress >= 0.0 && day_progress <= 1.0
	sun_arc: f32 = 0.0
	sun_px: f32 = 0.5
	sun_uy: f32 = 1.2
	if sun_above {
		sun_arc = fast_sin(clamp01(day_progress) * PI)
		sun_px = lerp(0.06, 0.94, day_progress)
		sun_uy = 1.0 - sun_arc * 0.9
	}
	sun_visibility := sun_above ? sun_arc * sun_k : 0.0

	for y in 0 ..< HEIGHT {
		is_water := y > HEIGHT / 2

		// 水面は空を上下反転してサンプリング
		ry := is_water ? HEIGHT - y : y
		// uy: 0(天頂/画面最上部) → 1(地平線)
		uy := f32(ry) / f32(HEIGHT / 2)
		dh := is_water ? f32(y - HEIGHT / 2) / f32(HEIGHT / 2) : 0.0 // 0〜1 (水面奥〜手前)

		for x in 0 ..< WIDTH {
			ux := f32(x) / f32(WIDTH)

			// ── 空のグラデーション（キーフレームパレットから） ─────────────
			sr := lerp(zenith[0], horizon_col[0], uy)
			sg := lerp(zenith[1], horizon_col[1], uy)
			sb := lerp(zenith[2], horizon_col[2], uy)

			// 地平線に近いほど強く出る暖色グロー（uyが1=地平線に近いほど強い）
			horizon_band := smoothstep(0.4, 1.0, uy) * vivid_k
			sr = lerp(sr, 255.0, horizon_band * 0.72)
			sg = lerp(sg, 130.0, horizon_band * 0.5)
			sb = lerp(sb, 65.0, horizon_band * 0.58)

			// 地平線ぎりぎりに、写真のようなクリアで濃い縁を重ねる
			rim_band := smoothstep(0.9, 1.0, uy) * vivid_k
			sr = lerp(sr, 255.0, rim_band * 0.55)
			sg = lerp(sg, 190.0, rim_band * 0.4)
			sb = lerp(sb, 140.0, rim_band * 0.35)

			// ── 太陽（弧を描いて移動・地平線付近は横に伸びる大気のにじみ） ──
			if sun_above {
				dx := ux - sun_px
				dy := uy - sun_uy
				// 地平線に近いほど横長に潰れた輝き（大気による屈折イメージ）
				squeeze := lerp(2.0, 1.0, clamp01(sun_uy))
				sun_dist := math.sqrt((dx * squeeze) * (dx * squeeze) + dy * dy)

				// コア（強い白〜黄）
				core := clamp01(1.0 - sun_dist / 0.045)
				sr = lerp(sr, 255.0, core * 0.95 * sun_visibility)
				sg = lerp(sg, 250.0, core * 0.95 * sun_visibility)
				sb = lerp(sb, 215.0, core * 0.9 * sun_visibility)

				// 中間グロー
				mid := clamp01(1.0 - sun_dist / 0.14)
				mid = mid * mid
				sr = lerp(sr, 255.0, mid * 0.55 * sun_visibility)
				sg = lerp(sg, 205.0, mid * 0.5 * sun_visibility)
				sb = lerp(sb, 130.0, mid * 0.45 * sun_visibility)

				// 外側の淡い大気ハレーション
				outer := clamp01(1.0 - sun_dist / 0.42)
				outer = outer * outer * outer
				sr = lerp(sr, 255.0, outer * 0.35 * sun_visibility)
				sg = lerp(sg, 190.0, outer * 0.30 * sun_visibility)
				sb = lerp(sb, 140.0, outer * 0.28 * sun_visibility)
			}

			// ── 雲 (fBM ノイズ・3オクターブ層でしっかり量感のある雲) ─────
			cloud_mask := smoothstep(0.85, 0.25, uy) // 地平線近くでは薄れる

			cx1 := ux * 2.1 + time * 0.005
			cy1 := uy * 1.7 + 10.0
			cn1 := fbm(cx1, cy1, 4)

			cx2 := ux * 4.4 - time * 0.011 + 73.1
			cy2 := uy * 3.4 + 31.7
			cn2 := fbm(cx2, cy2, 3)

			cx3 := ux * 9.0 + time * 0.02 + 5.5
			cy3 := uy * 7.0 - 12.3
			cn3 := fbm(cx3, cy3, 1)

			cloud_density := cn1 * 0.55 + cn2 * 0.30 + cn3 * 0.15
			cloud_alpha := cloud_density - 0.38
			if cloud_alpha < 0.0 do cloud_alpha = 0.0
			cloud_alpha = cloud_alpha * 2.1
			if cloud_alpha > 1.0 do cloud_alpha = 1.0
			cloud_alpha *= cloud_mask

			// 雲の立体感（濃いところは明るく、薄いところはやや暗く）
			cloud_shade := clamp01(0.5 + cloud_density * 0.7)

			// 昼の雲は白、夕暮れはオレンジ〜ピンク、夜は暗い青灰
			cloud_r := lerp(70.0, 255.0, cloud_shade) * lerp(1.0, 1.08, sun_k * 0.3)
			cloud_g := lerp(75.0, 248.0, cloud_shade)
			cloud_b := lerp(95.0, 255.0, cloud_shade)

			// 夕焼け・朝焼けで雲をオレンジに染める
			if vivid_k > 0.01 {
				warm := vivid_k * smoothstep(0.0, 0.9, uy)
				cloud_r = lerp(cloud_r, 255.0, warm * 0.55)
				cloud_g = lerp(cloud_g, 150.0, warm * 0.45)
				cloud_b = lerp(cloud_b, 90.0, warm * 0.5)
			}
			// 夜は雲も暗く沈める
			night_dim := 1.0 - star_k * 0.55
			cloud_r *= night_dim
			cloud_g *= night_dim
			cloud_b *= night_dim

			sr = lerp(sr, cloud_r, cloud_alpha * 0.9)
			sg = lerp(sg, cloud_g, cloud_alpha * 0.9)
			sb = lerp(sb, cloud_b, cloud_alpha * 0.9)

			// ── 星空（ウユニ塩湖の水面に映るよう、時間で点滅させない） ────
			if star_k > 0.0 && cloud_alpha < 0.35 {
				star_hash := _hash(i32(ux * 760.0), i32(uy * 560.0))
				if star_hash > 0.975 {
					tier := star_hash > 0.997 ? f32(1.0) : f32(0.4) // ごく一部だけ明るい星
					b := tier * star_k * (1.0 - cloud_alpha * 2.5)
					sr = lerp(sr, 255.0, clamp01(b))
					sg = lerp(sg, 255.0, clamp01(b * 0.97))
					sb = lerp(sb, 255.0, clamp01(b * 0.92))
				}
			}

			// ── 水面反射 ─────────────────────────────────────────────────
			rr, gg, bb: u8

			if is_water {
				// ウユニ塩湖のようなほぼ完全な鏡面：揺らぎはごく弱く、低周波のゆったりした波紋のみ
				wx := ux * 14.0 + time * 0.35
				wy := dh * 9.0 + time * 0.12
				shimmer := fast_sin(wx) * fast_sin(wy) * 0.5 + 0.5

				// 太陽が沈む方向に伸びる、水面に映る光の帯（グレア）
				glare: f32 = 0.0
				if sun_visibility > 0.0 {
					lane := smoothstep(0.10, 0.0, math.abs(ux - sun_px))
					glare = lane * sun_visibility * (1.0 - dh * 0.55) * 70.0
				}

				// 水面はほぼそのまま空を映す（わずかに暗く、手前は少し青みが強まる）
				darken := 0.74 + (1.0 - dh) * 0.13
				shimmer_add := shimmer * 4.0 * (1.0 - dh * 0.6)

				rr = u8(clamp01((sr * darken + shimmer_add + glare) / 255.0) * 255.0)
				gg = u8(clamp01((sg * darken + shimmer_add + glare * 0.85) / 255.0) * 255.0)
				bb = u8(clamp01((sb * darken + shimmer_add + glare * 0.55 + 3.0) / 255.0) * 255.0)
			} else {
				rr = u8(clamp01(sr / 255.0) * 255.0)
				gg = u8(clamp01(sg / 255.0) * 255.0)
				bb = u8(clamp01(sb / 255.0) * 255.0)
			}

			idx := (y * WIDTH + x) * 4
			pixel_buffer[idx + 0] = rr
			pixel_buffer[idx + 1] = gg
			pixel_buffer[idx + 2] = bb
			pixel_buffer[idx + 3] = 255
		}
	}
}

main :: proc() {
	init_noise()
}
