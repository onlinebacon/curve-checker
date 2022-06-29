#version 300 es
precision highp float;

in vec2 uv;

out vec4 FragColor;

uniform sampler2D tex;

void main() {
    FragColor = texture(tex, uv);
}
