// Использование в main.ts или другом файле
import outputJson from '../data/output.json';
import { generateAllSchemas, printTree } from './utils/schemaGenerator';

const schemas = generateAllSchemas(outputJson);

// const res = schemas.children.find((el) => el.path == "*.conditions.AvailableForFinish") 
// if (res)
// 	printTree(res)

for (const schemaNode of schemas.children) {
	console.log(schemaNode.path, schemaNode)
}

if (schemas.children[0].schema) {
	console.log(schemas.children[0].schema)
}