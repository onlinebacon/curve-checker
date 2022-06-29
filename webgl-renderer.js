const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const fixedWidth = 1000;

gl.clearColor(0, 0, 0, 1);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

const compileShader = (src, type) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, src.trim());
	gl.compileShader(shader);
	const info = gl.getShaderInfoLog(shader);
	if (info) throw new Error(info);
	return shader;
};

const loadShader = async (name, type) => {
	const url = `shaders/${name}.glsl`;
	const res = await fetch(url);
	const src = await res.text();
	return compileShader(src, type);
};

const createProgram = (vertex, fragment) => {
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.useProgram(program);
	return program;
};

let texture;
const createTexture = (img) => {
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 2);
};

const updateTexture = (img) => {
	if (texture === undefined) {
		createTexture(img);
	} else {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
};

let elementLength;
const createVertexArray = () => {
	const attrArray = new Float32Array([
		-1, -1, 0,   // 0
		-1,  1, 0,   // 1
		 0, -1, 0,   // 2
		 0,  1, 0,   // 3
		 
		 0, -1, 1, // 4
		 0,  1, 1, // 5
		 1, -1, 1, // 6
		 1,  1, 1, // 7
	]);

	const element = new Uint8Array([
		0, 1, 2,
		2, 1, 3,
		4, 5, 6,
		6, 5, 7,
	]);

	elementLength = element.length;

	const vertexArray = gl.createVertexArray();
	gl.bindVertexArray(vertexArray);
	
	const attrBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, attrArray, gl.STATIC_DRAW);

	const floatSize = attrArray.BYTES_PER_ELEMENT;
	const stride = floatSize*3;
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, floatSize*0);
	gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, floatSize*2);

	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	
	const elementBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, element, gl.STATIC_DRAW);
};

let program;
const locations = {};
const defaultUniforms = { earth_radius: 6371e3 };

const resizeCanvas = (width, height) => {
	canvas.width = width;
	canvas.height = height;
	gl.viewport(0, 0, width, height);
	setUniform({ screen_ratio: width/height });
};

const applyImageDimentions = ({ width, height }) => {
	const ratio = width/height;
	const screen_width = fixedWidth;
	const screen_height = Math.round(fixedWidth/ratio);
	resizeCanvas(screen_width, screen_height);
};

export const renderFrame = () => {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, elementLength, gl.UNSIGNED_BYTE, 0);
};

export const setUniform = (object) => {
	for (let key in object) {
		const value = object[key];
		const location = (
			(locations[key]) ??
			(locations[key] = gl.getUniformLocation(program, key))
		);
		gl.uniform1f(location, value);
	}
};

export const updateImage = (img) => {
	applyImageDimentions(img);
	updateTexture(img);
	renderFrame();
};

export const init = async () => {
	const vertex = await loadShader('vertex', gl.VERTEX_SHADER);
	const fragment = await loadShader('fragment', gl.FRAGMENT_SHADER);
	program = createProgram(vertex, fragment);
	createVertexArray();
	setUniform(defaultUniforms);
	applyImageDimentions(canvas);
};
