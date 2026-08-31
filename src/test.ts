import { getValuesByPath, getValueByPath, setValueByPath } from "./utils/utils";

const data = {
	a: {
		b: 1
	},
	b: 5,
	c: {
		b: 3
	},
};

setValueByPath(data, "a.b", 6)

console.log(getValuesByPath(data, "*.b"));
