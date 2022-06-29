#version 300 es
precision highp float;

in vec2 uv;
in float mixVal;

out vec4 FragColor;

uniform float screen_ratio;
uniform float earth_radius;
uniform float camera_height;
uniform float sensor_width;
uniform float focal_length;
uniform float dip;
uniform float roll;
uniform float prediction_opacity;

uniform sampler2D tex;

const float pi = 3.141592653589793;
const vec3 sky_color =   vec3(0.5, 0.7, 1.0);
const vec3 earth_color = vec3(0.0, 0.4, 0.8);

vec4 textureColor() {
	return texture(tex, uv);
}

vec4 predictionColor() {

	// Restore coord from UV
	vec2 coord = uv*2.0 - vec2(1.0, 1.0);

    // Rate in which the ray gets away from the line of sight
    float slope_x = sensor_width/2.0/focal_length;
    float slope_y = slope_x/screen_ratio;
    
    // Camera is above the earth in the y axis
    vec3 camera_pos = vec3(0.0, earth_radius + camera_height, 0.0);
    
    // Turn degrees into radians
    float dipRadians  = dip  * pi/180.0;
    float rollRadians = roll * pi/180.0;
    
    // Ray from the camera to the direction of the current pixel
    vec3 ray_dir = normalize(vec3(coord.x*slope_x, coord.y*slope_y, -1.0));
    
    // Rotate the ray clockwise (apply the roll)
    ray_dir = ray_dir*mat3(
		cos(rollRadians), sin(rollRadians), 0.0,
		-sin(rollRadians), cos(rollRadians), 0.0,
		0.0, 0.0, 1.0
    );
    
    // Tilt the ray down (apply the dip)
    ray_dir = ray_dir*mat3(
        1.0,       0.0,      0.0,
        0.0,  cos(dipRadians), sin(dipRadians),
        0.0, -sin(dipRadians), cos(dipRadians)
    );
    
    // t of closest point to the center of the earth in the ray line
    float t = dot(ray_dir, - camera_pos);
    
    // Closest point to the center of the earth in the ray line
    vec3 closest = camera_pos + ray_dir*t;
    
    // Closest distance between the ray and the center of the earth
    float dist = length(closest);
    
    if (dist > earth_radius || t < 0.0) {
        return vec4(sky_color, 1.0);
    } else {
        return vec4(earth_color, 1.0);
    }
}

void main() {
    FragColor = mix(textureColor(), predictionColor(), mixVal*prediction_opacity);
}
