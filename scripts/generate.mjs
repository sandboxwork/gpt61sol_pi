import {readFile,writeFile,mkdir} from 'node:fs/promises';
const key=process.env.FISH_API_KEY;if(!key)throw Error('Set FISH_API_KEY in .env');
const scenes=JSON.parse(await readFile('src/narration.json','utf8')); const sr=44100;let frames=0;const audio=[],chapters=[],words=[];await mkdir('public/media',{recursive:true});
for(const scene of scenes){
 const body={text:scene.text,format:'pcm',sample_rate:sr,latency:'normal',prosody:{speed:0.94,normalize_loudness:true},...(process.env.FISH_REFERENCE_ID?{reference_id:process.env.FISH_REFERENCE_ID}:{})};
 const response=await fetch('https://api.fish.audio/v1/tts/stream/with-timestamp',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',model:process.env.FISH_MODEL||'s2.1-pro'},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw Error(`Fish Audio ${response.status}: ${await response.text()}`);
 const payload=await response.text(); const chunks=[],snapshots=new Map();
 for(const block of payload.split(/\r?\n\r?\n/)){const data=block.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('\n');if(!data||data==='[DONE]')continue;const e=JSON.parse(data);if(e.error)throw Error('Fish synthesis failed');if(e.audio_base64)chunks.push(Buffer.from(e.audio_base64,'base64'));if(e.alignment)snapshots.set(e.chunk_seq,{alignment:e.alignment,offset:e.chunk_audio_offset_sec});}
 const pcm=Buffer.concat(chunks);if(!pcm.length||pcm.length%2)throw Error('Invalid PCM response');
 const start=frames/sr; frames+=pcm.length/2;audio.push(pcm);const end=frames/sr;
 const aligned=[...snapshots.values()].flatMap(({alignment,offset})=>(alignment.segments||[]).map(s=>({text:s.text,start:start+offset+s.start,end:Math.min(end,start+offset+s.end)}))).filter(s=>s.end>=s.start&&s.start<=end);
 words.push(...aligned);chapters.push({...scene,start,end,speechStart:aligned[0]?.start??start,speechEnd:aligned.at(-1)?.end??end,timingSource:aligned.length?'fish-timestamps':'pcm-samples'});console.log(`${scene.id}: ${(end-start).toFixed(2)}s; ${aligned.length} timestamp segments`);
}
const pcm=Buffer.concat(audio);const wav=Buffer.alloc(44);wav.write('RIFF');wav.writeUInt32LE(pcm.length+36,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);
await writeFile('public/media/narration.wav',Buffer.concat([wav,pcm]));await writeFile('public/media/timeline.json',JSON.stringify({provider:'Fish Audio',model:process.env.FISH_MODEL||'s2.1-pro',referenceId:process.env.FISH_REFERENCE_ID||null,sampleRate:sr,duration:frames/sr,chapters,words},null,2));console.log(`Generated ${(frames/sr).toFixed(2)}s`);
