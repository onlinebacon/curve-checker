const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const fixedWidth = 800;

const loadImage = (src) => new Promise((done) => {
	const img = document.createElement('img');
	img.onload = () => done(img);
	img.src = src;
});

gl.viewport(0, 0, canvas.width, canvas.height);
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

const createVertexArray = () => {
	const attrArray = new Float32Array([
		-1, -1,
		-1, +1,
		+1, +1,
		+1, -1,
	]);

	const element = new Uint8Array([
		0, 1, 3,
		3, 1, 2,
	]);

	const vertexArray = gl.createVertexArray();
	gl.bindVertexArray(vertexArray);
	
	const attrBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, attrBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, attrArray, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, attrArray.BYTES_PER_ELEMENT*2, 0);
	gl.enableVertexAttribArray(0);
	
	const elementBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, element, gl.STATIC_DRAW);
};

const renderFrame = () => {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
};

let program;
const locations = {};
const setUniforms = (object) => {
	for (let key in object) {
		const value = object[key];
		const location = (
			(locations[key]) ??
			(locations[key] = gl.getUniformLocation(program, key))
		);
		gl.uniform1f(location, value);
	}
};

const defaultUniforms = {
	screen_ratio: canvas.width/canvas.height,
	rotate: 0,
	squeeze: 0,
	translate_x: 0,
	translate_y: 0,
	scale: 1,
};

const main = async () => {
	const vertex = await loadShader('vertex', gl.VERTEX_SHADER);
	const fragment = await loadShader('fragment', gl.FRAGMENT_SHADER);
	program = createProgram(vertex, fragment);
	createVertexArray();
	setUniforms(defaultUniforms);
	renderFrame();
};

main().catch(console.error);

const fieldSample = document.querySelector('div.field');
fieldSample.remove();
fieldSample.removeAttribute('style');

const fields = [
	{ uniform: 'rotate', label: 'Rotate', min: -180, max: 180, step: 0.1 },
	{ uniform: 'squeeze', label: 'Squeeze', min: 0, max: 1, step: 0.01 },
	{ uniform: 'translate_x', label: 'Translate X', min: -1, max: 1, step: 0.01 },
	{ uniform: 'translate_y', label: 'Translate Y', min: -1, max: 1, step: 0.01 },
	{ uniform: 'scale', label: 'Zoom', min: 1, max: 100, ini: 1, step: 0.5 },
];

const mainDiv = document.querySelector('.main');
for (const field of fields) {
	const div = fieldSample.cloneNode(true);
	div.querySelector('.label').innerText = field.label;
	mainDiv.appendChild(div);
	const input = div.querySelector('input[type=number]');
	const range = div.querySelector('input[type=range]');
	input.value = field.ini ?? 0;
	range.value = field.ini ?? 0;
	const update = function() {
		const val = this.value*1;
		input.value = val;
		range.value = val;
		setUniforms({ [field.uniform]: val });
		renderFrame();
	};
	for (const e of [ input, range ]) {
		e.oninput = update;
		e.setAttribute('max', field.max);
		e.setAttribute('min', field.min);
		e.setAttribute('step', field.step);
	}
}

const resizeCanvas = (width, height) => {
	canvas.width = width;
	canvas.height = height;
	gl.viewport(0, 0, width, height);
	setUniforms({ screen_ratio: width/height });
};

const applyImageDimentions = (img) => {
	const width = img.width;
	const height = img.height;
	const ratio = width/height;
	const screen_width = fixedWidth;
	const screen_height = Math.round(fixedWidth/ratio);
	resizeCanvas(screen_width, screen_height);
};

const updateImage = (img) => {
	applyImageDimentions(img);
	updateTexture(img);
	renderFrame();
};

const inputFile = document.querySelector('input[type=file]');
inputFile.onchange = () => {
	const files = inputFile.files;
    if (files?.length) {
        const reader = new FileReader();
        reader.onload = function () {
			const img = document.createElement('img');
			img.onload = () => {
				updateImage(img);
				renderFrame();
			};
			img.src = reader.result;
        }
        reader.readAsDataURL(files[0]);
		files.length = 0;
    }
};
