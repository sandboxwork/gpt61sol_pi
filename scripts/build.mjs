import {mkdir,cp,rm} from 'node:fs/promises';
import {basename} from 'node:path';

await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
const options={recursive:true,filter:source=>basename(source)!=='.DS_Store'};
await cp('src','dist',options);
await cp('public','dist',options);
console.log('Built dist/');
