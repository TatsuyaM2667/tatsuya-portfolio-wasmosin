package main

import "core:math"
WIDTH :: 512
HEIGHT :: 384
NOISE_DIM :: 64

@(export)
get_width :: proc "contextless" () -> i32 {return WIDTH}

@(export)
get_height :: proc "contextless" () -> i32 {return HEIGHT}

//高速三角関数
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

// 共有バファ
pixel_buffer: [WIDTH * HEIGHT * 4]u8
noise_tex: [NOISE_DIM * NOISE_DIM]f32
// 山並みのシルエット列は(x)ごとに一度だけ計算してキャッシュ
mtn_height_by_x: [WIDTH]f32

// JS 側にバッファ先頭ポインタ
@(export)
get_buffer_ptr :: proc "contextless" () -> ^u8 {
	return &pixel_buffer[0]
}

//ユーティリティ

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

fabs1 :: proc "contextless" (x: f32) -> f32 {
	return x < 0 ? -x : x
}

//ノイズテクスチャ

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

	// render_frameを軽量化
	for x in 0 ..< WIDTH {
		ux := f32(x) / f32(WIDTH)
		mtn_height_by_x[x] = 0.02 + fbm(ux * 2.4 + 17.3, 4.0, 3) * 0.05
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

//一日の色パレット（キーフレーム方式）
// 朝昼晩それぞれの段階がはっきり感じられるよう、複数のキーフレームを補間する。
// sun_k=太陽の輝き強度 / star_k=星空の見え方 / vivid_k=地平線の彩度・コントラスト
Keyframe :: struct {
	phase:   f32,
	zenith:  [3]f32,
	horizon: [3]f32,
	sun_k:   f32,
	star_k:  f32,
	vivid_k: f32,
}

DAY_KEYFRAMES := [8]Keyframe {
	{0.00, {7, 9, 24}, {15, 17, 36}, 0.0, 0.85, 0.06}, // 深夜
	{0.14, {11, 15, 42}, {35, 25, 48}, 0.05, 0.55, 0.22}, // 夜明け前
	{0.24, {42, 58, 120}, {245, 140, 90}, 1.0, 0.02, 0.85}, // 日の出
	{0.36, {20, 80, 215}, {130, 210, 255}, 1.0, 0.0, 0.15}, // 朝
	{0.50, {15, 75, 210}, {140, 220, 255}, 1.0, 0.0, 0.10}, // 正午
	{0.64, {25, 60, 180}, {170, 200, 240}, 0.95, 0.0, 0.25}, // 夕方前
	{0.76, {36, 50, 112}, {245, 100, 78}, 1.0, 0.02, 0.85}, // 日没
	{0.88, {11, 15, 42}, {38, 28, 48}, 0.05, 0.55, 0.24}, // 夜の始まり
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

// 一日の長さ（秒）
DAY_LENGTH :: 480.0
ARC_START :: 0.18 // 日の出
ARC_END :: 0.82 // 日の入り

// 0.14 * 480 = 67.2秒分を加算することでtime=0のとき phase≈0.14 になる
TIME_OFFSET :: 0.14 * DAY_LENGTH

// マウス操作によるさざ波（湖のインタラクション）
// JS側でポインタ移動/クリックに応じて spawn_ripple を呼び、波紋を水面に広げる。
RIPPLE_MAX :: 5
RIPPLE_LIFETIME :: 2.4
RIPPLE_SPEED :: 0.60

Ripple :: struct {
	x, y:       f32, // 発生位置 (ux, dh 空間: dh=0 水平線 → 1 手前)
	start_time: f32,
	strength:   f32,
	active:     bool,
}

ripples: [RIPPLE_MAX]Ripple
ripple_cursor: int

@(export)
spawn_ripple :: proc "contextless" (x, y, time, strength: f32) {
	ripples[ripple_cursor] = Ripple{x, y, time, strength, true}
	ripple_cursor = (ripple_cursor + 1) % RIPPLE_MAX
}

// 流れ星
// 時刻から決定論的に「いつ・どこに」流れ星が出るかを計算する
METEOR_PERIOD :: 9.0 // 流れ星の抽選間隔
METEOR_CHANCE :: 0.4 // 抽選の当選確率
METEOR_DURATION :: 0.85
METEOR_TRAIL :: 0.09

//　メインレンダラ
// JS の requestAnimationFrame timestamp / 1000
@(export)
render_frame :: proc "contextless" (time: f32) {
	PI :: 3.14159265358979

	// TIME_OFFSET+日の出直前(phase≈0.14)からスタート
	adj_time := time + TIME_OFFSET
	phase := frac1(adj_time / DAY_LENGTH)
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

	// weather: low-frequency noise decides how cloudy "today" is, so it is not
	// always the same amount of cloud cover.
	weather := fbm(adj_time * 0.0009, 88.0, 2)
	weather_amount := clamp01(weather * 0.9 - 0.35) // 0=clear .. 1=cloudy  ← さらに晴れがちに

	// shooting stars: split time into METEOR_PERIOD slots and deterministically
	// decide per-slot (via hash of the slot index) whether a meteor appears and
	// where it starts/heads, so no JS-side spawn call or mutable state is needed.
	meteor_slot := math.floor(time / METEOR_PERIOD)
	meteor_roll := _hash(i32(meteor_slot), 733)
	meteor_has := meteor_roll > (1.0 - METEOR_CHANCE)
	seed_t := _hash(i32(meteor_slot) + 91, 271)
	seed_x := _hash(i32(meteor_slot) + 17, 555)
	seed_y := _hash(i32(meteor_slot) + 3, 909)
	seed_ang := _hash(i32(meteor_slot) + 61, 137)

	meteor_start :=
		f32(meteor_slot) * METEOR_PERIOD + seed_t * (METEOR_PERIOD - METEOR_DURATION - 0.3)
	meteor_age := time - meteor_start
	meteor_active :=
		meteor_has && star_k > 0.2 && meteor_age >= 0.0 && meteor_age < METEOR_DURATION

	meteor_x0: f32 = 0.0
	meteor_y0: f32 = 0.0
	meteor_dir_x: f32 = 0.0
	meteor_dir_y: f32 = 1.0
	meteor_head_x: f32 = 0.0
	meteor_head_y: f32 = 0.0
	meteor_fade: f32 = 0.0
	if meteor_active {
		meteor_x0 = lerp(0.12, 0.88, seed_x)
		meteor_y0 = lerp(0.02, 0.3, seed_y)
		ang := lerp(-0.5, 0.5, seed_ang)
		meteor_dir_x = fast_sin(ang)
		meteor_dir_y = fast_cos(ang)
		meteor_t := clamp01(meteor_age / METEOR_DURATION)
		travel := meteor_t * 0.5
		meteor_head_x = meteor_x0 + meteor_dir_x * travel
		meteor_head_y = meteor_y0 + meteor_dir_y * travel
		// 発光/消滅のフィード
		meteor_fade = smoothstep(0.0, 0.12, meteor_t) * smoothstep(1.0, 0.75, meteor_t) * star_k
	}

	// 有効な波紋があるかを一度だけ判定（無ければ水面ループを軽量化）
	any_ripple := false
	for i in 0 ..< RIPPLE_MAX {
		if ripples[i].active {
			age := time - ripples[i].start_time
			if age >= 0.0 && age < RIPPLE_LIFETIME {
				any_ripple = true
			} else {
				ripples[i].active = false
			}
		}
	}

	for y in 0 ..< HEIGHT {
		is_water := y > HEIGHT / 2

		// 水面は空を上下反転してサンプリング
		ry := is_water ? HEIGHT - y : y
		// uy: 0(天頂/画面最上部) → 1(地平線)
		uy := f32(ry) / f32(HEIGHT / 2)
		dh := is_water ? f32(y - HEIGHT / 2) / f32(HEIGHT / 2) : 0.0 // 0〜1 (水面奥〜手前)

		// uyのみに依存する量はxループの外で一度だけ計算して、全ピクセルでの重複計算を避ける
		day_like := clamp01(1.0 - star_k * 1.3)
		haze_band := smoothstep(0.5, 1.0, uy) * day_like * clamp01(1.0 - vivid_k * 1.4) * 0.22
		horizon_band_shape := smoothstep(0.4, 1.0, uy) * vivid_k
		rim_band_shape := smoothstep(0.9, 1.0, uy) * vivid_k
		cloud_mask := smoothstep(0.82, 0.3, uy) // 地平線近くでは薄れる

		for x in 0 ..< WIDTH {
			ux := f32(x) / f32(WIDTH)

			// 地平線の暖色は太陽のある方位に集中させる（現実の日の出/日没は地平線全体が一気に明るくなるのではなく、太陽の位置を中心に徐々に明るくなる）。
			// グロー層だけではなく、地平線の基本色も太陽からの距離で変化させる。
			sun_h_dist := fabs1(ux - sun_px)
			az01 := sun_above ? smoothstep(0.5, 0.0, sun_h_dist) : 0.1
			sun_az := sun_above ? lerp(0.02, 1.2, az01) : 0.1

			// 太陽から遠い地平線は、のちに中間色（天頂と同じ方向の色）に近づけて、両端まで不自然に明るくなるのを防ぐ
			horizon_col_muted := mix3(horizon_col, zenith, 0.85)
			horizon_col_local := mix3(horizon_col_muted, horizon_col, clamp01(az01 * 1.8))

			//　空のグレードレーショコン（キーフレームパレットから）
			sr := lerp(zenith[0], horizon_col_local[0], uy)
			sg := lerp(zenith[1], horizon_col_local[1], uy)
			sb := lerp(zenith[2], horizon_col_local[2], uy)

			// 大気による薄いヘイズ（日中はうっすら青白く、朝夕/夜は目立たない）
			sr = lerp(sr, 205.0, haze_band)
			sg = lerp(sg, 215.0, haze_band)
			sb = lerp(sb, 228.0, haze_band)

			horizon_band := horizon_band_shape * sun_az
			rim_band := rim_band_shape * sun_az

			// 地平線に近いほど強く出る朝夕の暖色グロー（uyが1=地平線に近いほど強い）
			sr = lerp(sr, 255.0, horizon_band * 0.68)
			sg = lerp(sg, 130.0, horizon_band * 0.46)
			sb = lerp(sb, 68.0, horizon_band * 0.54)

			// 地平線ぎりぎりに、写真のようなクリアで濃い縁を重ねる
			sr = lerp(sr, 255.0, rim_band * 0.5)
			sg = lerp(sg, 190.0, rim_band * 0.38)
			sb = lerp(sb, 140.0, rim_band * 0.32)

			//太陽（弧を描いて移動・地平線付近は横に伸びる大気のにじみ）
			if sun_above {
				dx := ux - sun_px
				dy := uy - sun_uy
				squeeze := lerp(2.0, 1.0, clamp01(sun_uy))
				sun_dist := math.sqrt((dx * squeeze) * (dx * squeeze) + dy * dy)

				core := clamp01(1.0 - sun_dist / 0.045)
				sr = lerp(sr, 255.0, core * 0.95 * sun_visibility)
				sg = lerp(sg, 250.0, core * 0.95 * sun_visibility)
				sb = lerp(sb, 215.0, core * 0.9 * sun_visibility)

				mid := clamp01(1.0 - sun_dist / 0.14)
				mid = mid * mid
				sr = lerp(sr, 255.0, mid * 0.5 * sun_visibility)
				sg = lerp(sg, 205.0, mid * 0.45 * sun_visibility)
				sb = lerp(sb, 130.0, mid * 0.4 * sun_visibility)

				outer := clamp01(1.0 - sun_dist / 0.38)
				outer = outer * outer * outer
				sr = lerp(sr, 255.0, outer * 0.28 * sun_visibility)
				sg = lerp(sg, 190.0, outer * 0.24 * sun_visibility)
				sb = lerp(sb, 140.0, outer * 0.22 * sun_visibility)
			}

			// 雲（2レイヤー構成で積乱雲とちぎれ雲を表現）
			// Layer 1: 上空のちぎれ雲/高層雲
			warp_x1 := fbm(ux * 0.8 + 4.0, uy * 0.7 + adj_time * 0.006, 2)
			warp_y1 := fbm(ux * 0.8 + 91.3, uy * 0.7 + adj_time * 0.006, 2)
			cx1 := ux * 1.3 + (warp_x1 - 0.5) * 0.6 + adj_time * 0.015
			cy1 := uy * 0.9 + (warp_y1 - 0.5) * 0.4 + 10.0
			cn1 := fbm(cx1, cy1, 4)

			// Layer 2: 下層の巨大な積乱雲（モコモコ感）
			warp_x2 := fbm(ux * 0.5 + 20.7, uy * 0.6 + adj_time * 0.004, 2)
			warp_y2 := fbm(ux * 0.5 + 73.1, uy * 0.6 + adj_time * 0.004, 2)
			cx2 := ux * 1.5 + (warp_x2 - 0.5) * 0.8 + adj_time * 0.005 + 50.0 // uxスケールを少し広げる
			cy2 := uy * 1.2 + (warp_y2 - 0.5) * 0.7 + 30.0
			cn2 := fbm(cx2, cy2, 5)

			cn_merged := cn2 * 0.75 + cn1 * 0.25

			// 上に行くほど雲を減らして「塔」のような形を強調するグラデーション
			height_mask := (1.0 - uy) * 0.18
			cloud_edge := 0.62 + height_mask - weather_amount * 0.15

			d := clamp01((cn_merged - cloud_edge) * 5.0 + 0.5)
			cloud_alpha := d * d * (3.0 - 2.0 * d)
			cloud_alpha *= cloud_mask

			// アニメ風のぱきっとした陰影（光が当たるエッジは白、中心部は青紫の影）
			cloud_shade := clamp01(0.35 + d * 0.75 + smoothstep(0.9, 0.4, uy) * 0.3)

			cloud_r := lerp(120.0, 255.0, cloud_shade)
			cloud_g := lerp(138.0, 255.0, cloud_shade)
			cloud_b := lerp(175.0, 255.0, cloud_shade)

			// 太陽の光を受けたときの暖色（夕焼け時など）
			if vivid_k > 0.01 {
				warm := vivid_k * smoothstep(0.0, 0.9, uy)
				cloud_r = lerp(cloud_r, 255.0, warm * 0.60)
				cloud_g = lerp(cloud_g, 150.0, warm * 0.45)
				cloud_b = lerp(cloud_b, 100.0, warm * 0.50)
			}

			night_dim := 1.0 - star_k * 0.6
			cloud_r *= night_dim
			cloud_g *= night_dim
			cloud_b *= night_dim

			sr = lerp(sr, cloud_r, cloud_alpha * 0.92)
			sg = lerp(sg, cloud_g, cloud_alpha * 0.92)
			sb = lerp(sb, cloud_b, cloud_alpha * 0.92)

			// 星空（地球の自転・公転に伴う天の極を中心とした滑らかな円状の動き）
			if star_k > 0.0 && cloud_alpha < 0.3 {
				// 画面上部中央の外(0.5, -0.2)を天の北極に見立てて全体を回転
				rot_angle := adj_time * -0.0015 // ゆっくりとした時計回り
				rc := fast_cos(rot_angle)
				rs := fast_sin(rot_angle)

				sdx := ux - 0.5
				sdy := uy + 0.2

				ru := sdx * rc - sdy * rs
				rv := sdx * rs + sdy * rc

				star_scale :: 500.0
				star_px := ru * star_scale
				star_py := rv * star_scale

				st_ix := math.floor(star_px)
				st_iy := math.floor(star_py)
				st_fx := star_px - st_ix
				st_fy := star_py - st_iy

				star_hash := _hash(i32(st_ix), i32(st_iy))
				if star_hash > 0.990 { 	// 全体の約1%のマスに星を配置
					pdx := st_fx - 0.5
					pdy := st_fy - 0.5
					pdist := math.sqrt(pdx * pdx + pdy * pdy)
					// アンチエイリアスの効いた滑らかな円（移動時にチカチカしない）
					star_glow := clamp01(1.0 - pdist * 2.8)
					if star_glow > 0.0 {
						tier := star_hash > 0.997 ? f32(0.95) : f32(0.35)
						b := star_glow * tier * star_k * (1.0 - cloud_alpha * 3.0)
						sr = lerp(sr, 250.0, clamp01(b))
						sg = lerp(sg, 250.0, clamp01(b * 0.96))
						sb = lerp(sb, 255.0, clamp01(b * 0.94))
					}
				}
			}

			// 流れ星（ある瞬間だけリストを尾引いて新べる。水面にも映って光る）
			if meteor_active {
				px := ux - meteor_head_x
				py := uy - meteor_head_y
				// 進行方向とは逆向き（尾の方向）に投影し、尾の長さでクリープ
				back_x := -meteor_dir_x
				back_y := -meteor_dir_y
				proj := px * back_x + py * back_y
				proj_c := proj < 0.0 ? 0.0 : (proj > METEOR_TRAIL ? METEOR_TRAIL : proj)
				cxp := meteor_head_x + back_x * proj_c
				cyp := meteor_head_y + back_y * proj_c
				ddx := ux - cxp
				ddy := uy - cyp
				mdist := math.sqrt(ddx * ddx + ddy * ddy)

				core := clamp01(1.0 - mdist / 0.0032)
				glow := clamp01(1.0 - mdist / 0.011)
				trail_t := proj_c / METEOR_TRAIL
				trail_env := (1.0 - trail_t) * (1.0 - trail_t)

				mb := (core * 0.95 + glow * glow * 0.5) * trail_env * meteor_fade
				sr = lerp(sr, 255.0, clamp01(mb))
				sg = lerp(sg, 255.0, clamp01(mb * 0.98))
				sb = lerp(sb, 255.0, clamp01(mb))
			}

			// 昼間の鳥
			/*
			if sun_above && day_like > 0.2 {
				for i in 0..<3 {
					b_t := adj_time * 0.02 + f32(i) * 3.7
					bx := frac1(b_t)
					by := 0.25 + f32(i)*0.03 + fast_sin(b_t * 20.0) * 0.015 - bx * 0.1

					dx := fabs1(ux - bx)
					dy := by - uy // uyは下に行くほど増えるので、翼は by > uy
					if dy > 0.0 && dy < 0.012 && dx < 0.02 {
						wing := fabs1(dy - dx * 0.6)
						if wing < 0.003 {
							sr = lerp(sr, 20.0, 0.85)
							sg = lerp(sg, 22.0, 0.85)
							sb = lerp(sb, 30.0, 0.85)
						}
					}
				}
			}
			*/
			// 遠くの山並み
			mtn_height := mtn_height_by_x[x]
			mtn_edge := 1.0 - mtn_height
			mtn_mask := smoothstep(mtn_edge - 0.012, mtn_edge + 0.006, uy)
			if mtn_mask > 0.0 {
				dark := 0.24 + haze_band * 0.1
				mr := sr * dark + 6.0
				mg := sg * dark + 8.0
				mb := sb * (dark + 0.05) + 16.0
				sr = lerp(sr, mr, mtn_mask)
				sg = lerp(sg, mg, mtn_mask)
				sb = lerp(sb, mb, mtn_mask)
			}

			// 水面反射
			rr, gg, bb: u8

			if is_water {
				// 穏やかに寄せる波
				persp_scale := 1.0 / (0.2 + dh * 0.8)
				wx := (ux - 0.5) * persp_scale * 8.0 + adj_time * 0.4
				wy := persp_scale * 5.0 - adj_time * 1.2
				shimmer := fast_sin(wx) * fast_sin(wy) * 0.5 + 0.5
				swell := fast_cos(persp_scale * 2.5 - adj_time * 0.8) * 0.5 + 0.5

				// 太陽が沈む方向に伸びる、水面に映る光の帯（グレア）
				glare: f32 = 0.0
				if sun_visibility > 0.0 {
					lane := smoothstep(0.10, 0.0, fabs1(ux - sun_px))
					glare = lane * sun_visibility * (1.0 - dh * 0.55) * 65.0
				}

				// マウス操作で広がる波紋
				ripple_add: f32 = 0.0
				if any_ripple {
					persp := 1.0 / (0.35 + dh * 0.65)
					for i in 0 ..< RIPPLE_MAX {
						rp := ripples[i]
						if !rp.active do continue
						age := time - rp.start_time
						if age < 0.0 || age >= RIPPLE_LIFETIME do continue
						ddx := ux - rp.x
						ddy := (dh - rp.y) * persp
						dist := math.sqrt(ddx * ddx + ddy * ddy)
						radius := age * RIPPLE_SPEED

						d := dist - radius // 負=波面を通り過した内側、正=まだ届いていない外側
						trail := 0.05 + age * 0.05
						if d < 0.0 && d > -trail {
							local_t := -d / trail // 0=最前線 〜 1=波紋の後方
							osc := fast_cos(local_t * 10.0)
							env := (1.0 - local_t) * (1.0 - local_t)
							fade := clamp01(1.0 - age / RIPPLE_LIFETIME)
							ripple_add += osc * env * fade * fade * rp.strength * 20.0
						}
					}
				}

				darken := 0.88 + (1.0 - dh) * 0.12
				shimmer_add := (shimmer * 1.2 + swell * 1.5) * (1.0 - dh * 0.6)
				extra := shimmer_add + glare + ripple_add

				rr = u8(clamp01((sr * darken + extra) / 255.0) * 255.0)
				gg = u8(clamp01((sg * darken + extra * 0.92) / 255.0) * 255.0)
				bb = u8(clamp01((sb * darken + extra * 0.7 + 3.0) / 255.0) * 255.0)
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
