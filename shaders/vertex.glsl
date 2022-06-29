#version 300 es
precision highp float;

layout (location = 0) in vec2 vertex;
layout (location = 1) in float inputMixVal;

out vec2 uv;
out float mixVal;

uniform float screen_ratio;
uniform float rotate;
uniform float squeeze;
uniform float translate_x;
uniform float translate_y;
uniform float scale;
uniform float slider_offset;

const float pi = 3.141592653689793;

vec2 rotateVec(vec2 coord, float radians) {
	float cos_val = cos(radians);
	float sin_val = sin(radians);
	return coord*mat2(
		  cos_val, sin_val,
		- sin_val, cos_val
	);
}

void main() {

	vec2 coord = vertex;
	float isSlidder = 1.0 - abs(coord.x);
	coord.x += slider_offset*isSlidder;

	uv = (coord + 1.0)/2.0;
	mixVal = inputMixVal;

	vec2 pos = coord;
	pos.x *= screen_ratio;
	pos = rotateVec(pos, rotate/180.0*pi);
	pos.x /= screen_ratio;
	pos.x *= 1.0 - squeeze;
	pos += vec2(translate_x, translate_y);
	pos *= scale;

	gl_Position = vec4(pos, 0.0, 1.0);
}
