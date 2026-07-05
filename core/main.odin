package main
import "core:math"

WIDTH :: 800
HEIGHT :: 600
PIXEL_COUNT :: WIDTH * HEIGHT
BUFFER_SIZE :: PIXEL_COUNT * 4 //RGBA

pixel_buffer: [BUFFER_SIZE]u8

@(export)
get_buffer_ptr :: proc "contextless" () -> ^u8 {
	return &pixel_buffer[0]
}

@(export)
render_frame :: proc "contextless" (time: f32) {
	// 太陽の高さ（-1.0〜1.0）をサイン波でシミュレート（日の出〜日没）
	sun_height := math.sin(time * 0.1)

	for y in 0 ..< HEIGHT {
		// 画面中央(HEIGHT/2)を地平線（ウユニの境界）とする
		is_water := y > HEIGHT / 2

		// 反射の場合はY座標を反転させて空を計算
		calc_y := is_water ? HEIGHT - y : y

		// 正規化座標 (0.0 ~ 1.0)
		uv_y := f32(calc_y) / f32(HEIGHT / 2)

		for x in 0 ..< WIDTH {
			uv_x := f32(x) / f32(WIDTH)

			// --- ここに空の色、太陽、fBMノイズを使った雲の計算が入る ---

			r: u8 = 20 // Tokyo Night的な深いブルーのベース
			g: u8 = u8(40 + (sun_height * 40)) // 太陽の高さで明るさが変わる
			b: u8 = u8(100 + (uv_y * 100))

			// 水面(下半分)の場合は、波の揺らぎや少し暗くする処理を入れる
			if is_water {
				r = r / 2
				g = g / 2
				b = b / 2
			}

			// ピクセルバッファにRGBAを書き込む
			idx := (y * WIDTH + x) * 4
			pixel_buffer[idx + 0] = r
			pixel_buffer[idx + 1] = g
			pixel_buffer[idx + 2] = b
			pixel_buffer[idx + 3] = 255 // Alpha (不透明)
		}
	}
}

main :: proc() {}
