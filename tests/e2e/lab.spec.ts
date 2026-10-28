import { test, expect } from '@playwright/test';
import catalogue from '../../public/models/catalogue.json' with { type: 'json' };
import reference from '../model-reference.json' with { type: 'json' };
const initial=catalogue.samples.find(s=>s.split==='test'&&s.support==='supported')!;
const expected=reference.find(r=>r.id===initial.id)!;
test('real ONNX inference, 3D, comparison persistence and export',async({page})=>{
  const remote:string[]=[];
  page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith('http://127.0.0.1'))remote.push(r.url());});
  await page.goto('');
  await expect(page.getByTestId('prediction-ready')).toBeVisible();
  for(const [i,k] of ['yield','tensile','elongation'].entries()){
    const value=expected.expected[k as keyof typeof expected.expected].toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1});
    await expect(page.locator('.property-value').nth(i)).toContainText(value);
  }
  await expect(page.getByTestId('specimen-view')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Play illustration',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pause illustration',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset illustration'}).click();
  await expect(page.getByRole('slider',{name:'Illustration stage'})).toHaveValue('0');
  await page.getByRole('button',{name:'Add to comparison'}).click();
  await page.getByRole('button',{name:/^Compare/}).click();
  await expect(page.getByRole('heading',{name:'Compare the evidence.'})).toBeVisible();
  const exported=page.waitForEvent('download');await page.getByRole('button',{name:'CSV',exact:true}).click();
  expect((await exported).suggestedFilename()).toBe('materials-comparison.csv');
  await page.reload();await expect(page.getByRole('button',{name:`Remove ${initial.id}`})).toBeVisible();
  await page.getByRole('button',{name:`Remove ${initial.id}`}).click();
  await expect(page.getByRole('heading',{name:'A comparison starts with a specimen.'})).toBeVisible();
  expect(remote).toEqual([]);
});
test('CSV validation, local persistence and model comparison',async({page})=>{
  await page.goto('#measurements');await expect(page.getByRole('heading',{name:'Bring your measurements.'})).toBeVisible();
  const file=page.getByLabel('Import measurement CSV');
  await file.setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('sample_id,catalogue_id,yield_mpa\nx,UNKNOWN,100')});
  await expect(page.getByRole('alert')).toContainText('unknown catalogue_id');
  await file.setInputFiles({name:'lab.csv',mimeType:'text/csv',buffer:Buffer.from(`sample_id,catalogue_id,yield_mpa,tensile_mpa,elongation_percent\nLocal-01,${initial.id},200,300,12`)});
  await expect(page.getByRole('row',{name:/Local-01/})).toContainText('Δ');
  await page.reload();await expect(page.getByRole('row',{name:/Local-01/})).toBeVisible();
  await page.getByRole('button',{name:'Clear local measurements'}).click();await expect(page.getByRole('row',{name:/Local-01/})).toHaveCount(0);
});
test('missing model assets produce a recoverable error',async({page})=>{
  await page.route('**/models/*.onnx',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.goto('');await expect(page.getByRole('alert')).toContainText('503');
  await page.unroute('**/models/*.onnx');await page.getByRole('button',{name:'Retry prediction'}).click();
  await expect(page.getByTestId('prediction-ready')).toBeVisible();
});
test('incompatible manifest is rejected before inference',async({page})=>{
  await page.route('**/models/manifest.json',async r=>{const response=await r.fetch();const data=await response.json();data.schemaVersion=999;await r.fulfill({json:data});});
  await page.goto('');await expect(page.getByRole('alert')).toContainText('Incompatible model manifest');
});
test('mobile, reduced motion, keyboard and WebGL fallback',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type.startsWith('webgl'))return null;return Reflect.apply(original,this,[type,...args]);} as typeof original;});
  await page.goto('');await expect(page.getByTestId('prediction-ready')).toBeVisible();
  await expect(page.getByText('3D is unavailable. Predictions remain available.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Play illustration',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
  await page.getByRole('link',{name:'Skip to content'}).focus();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
});
test('mocked worker fixture exercises model-independent UI',async({page})=>{
  await page.addInitScript(({id,values})=>{
    class FixtureWorker {
      onmessage:((event:{data:unknown})=>void)|null=null; onerror=null;
      postMessage(request:{requestId:number;sampleId:string}) {setTimeout(()=>this.onmessage?.({data:{requestId:request.requestId,prediction:{sampleId:request.sampleId,modelVersion:'fixture',support:'supported',valid:true,estimates:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{value:v,lower:v*.8,upper:v*1.2}]))}}}),0);}
      terminate(){}
    }
    if(id)Object.defineProperty(window,'Worker',{value:FixtureWorker});
  },{id:initial.id,values:{yield:123.4,tensile:234.5,elongation:12.3}});
  await page.goto('');await expect(page.getByTestId('prediction-ready')).toBeVisible();await expect(page.locator('.property-value').first()).toContainText('123.4');
});
