import * as WebglRenderer from './webgl-renderer.js';

const fieldSample = document.querySelector('div.field');
fieldSample.remove();
fieldSample.removeAttribute('style');

const fields = [
	{ container: 'transform', uniform: 'rotate', label: 'Rotate', min: -180, max: 180, ini: 0 },
	{ container: 'transform', uniform: 'squeeze', label: 'Squeeze', min: 0, max: 1, ini: 0 },
	{ container: 'transform', uniform: 'translate_x', label: 'Translate X', min: -1, max: 1, ini: 0 },
	{ container: 'transform', uniform: 'translate_y', label: 'Translate Y', min: -1, max: 1, ini: 0 },
	{ container: 'transform', uniform: 'scale', label: 'Zoom', min: 1, max: 30, ini: 1 },
	{ container: 'camera', uniform: 'camera_height', label: 'Height (meters)', min: 0, max: 1e6, ini: 10e3 },
	{ container: 'camera', uniform: 'sensor_width', label: 'Sensor width (mm)', min: 1, max: 100, ini: 36 },
	{ container: 'camera', uniform: 'focal_length', label: 'Focal length (mm)', min: 1, max: 1000, ini: 50 },
	{ container: 'camera', uniform: 'dip', label: 'Dip angle', min: -90, max: 90, ini: 0 },
	{ container: 'camera', uniform: 'roll', label: 'Rotation', min: -90, max: 90, ini: 0 },
	{ container: 'compare', uniform: 'prediction_opacity', label: 'Opacity', min: 0, max: 1, ini: 0 },
	{ container: 'compare', uniform: 'slider_offset', label: 'Slidder', min: -1, max: 1, ini: -1 },
];

const addField = (field) => {
	const selector = `.fields-container.${field.container} .content`;
	const target = document.querySelector(selector);
	const div = fieldSample.cloneNode(true);
	div.querySelector('.label').innerText = field.label;
	target.appendChild(div);
	const input = div.querySelector('input[type=number]');
	const range = div.querySelector('input[type=range]');
	const ini = field.ini;
	const update = function() {
		const val = this.value*1;
		input.value = val;
		range.value = val;
		WebglRenderer.setUniform({ [field.uniform]: val });
		WebglRenderer.renderFrame();
	};
	for (const e of [ input, range ]) {
		e.oninput = update;
		e.setAttribute('max', field.max);
		e.setAttribute('min', field.min);
		e.setAttribute('step', 0.01);
		e.value = ini;
	}
	WebglRenderer.setUniform({ [field.uniform]: ini });
};

const bindInputFile = () => {
	const inputFile = document.querySelector('input[type=file]');
	inputFile.onchange = () => {
		const files = inputFile.files;
		if (files?.length) {
			const reader = new FileReader();
			reader.onload = function () {
				const img = document.createElement('img');
				img.onload = () => {
					WebglRenderer.updateImage(img);
					WebglRenderer.updateRender();
				};
				img.src = reader.result;
			}
			reader.readAsDataURL(files[0]);
			inputFile.value = '';
		};
	};
};

const bindToggleButton = () => {
	document.body.onclick = e => {
		const target = e.target;
		if (!target.matches('.toggle')) {
			return;
		}
		let container = target;
		while (container && !container.matches('.fields-container')) {
			container = container.parentElement;
		}
		let classes = container.getAttribute('class').trim().split(/\s+/);
		if (classes.includes('closed')) {
			classes = classes.filter(cls => cls !== 'closed');
		} else {
			classes.push('closed');
		}
		container.setAttribute('class', classes.join(' '));
	};
};

bindInputFile();
bindToggleButton();
WebglRenderer.init().then(() => {
	fields.forEach(addField);
});
