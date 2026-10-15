import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ToggleGroup from '@/components/calculator/ToggleGroup';
import { expect, it, vi, afterEach } from 'vitest';
import { readdirSync } from 'node:fs';
import { uiHarness, identifiers, visibleCopy } from './uiHarness.test-support';
import { hasMissingInput } from './calcInput';
import { withParticle } from './korean';
const params=vi.hoisted(()=>new URLSearchParams());
vi.mock('next/navigation',()=>({useSearchParams:()=>params,usePathname:()=>'/'}));
import PropertyYield from '@/components/calculator/PropertyYieldCalc';
const browser={location:{pathname:'/real-estate/property-yield-calculator',search:'',hash:''},history:{replaceState:vi.fn()}};
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllTimers();vi.useRealTimers()});
it('existing balances need explicit zero and input edits remove the result',()=>{
 vi.useFakeTimers();vi.stubGlobal('window',browser);
 const view=uiHarness(PropertyYield);
 const change=(key:string,value:string)=>{const node=view.nodes().find(n=>n.props.name===key);expect(node,key).toBeDefined();(node!.props.onChange as (v:string)=>void)(value)};
 change('purchasePrice','10000');change('monthlyRent','50');
 expect(view.props('ResultCard')).toBeUndefined();
 for(const key of ['deposit','loanAmount','monthlyCost','extraCost'])change(key,'0');
 expect(view.props('ResultCard')).toBeDefined();
 change('loanRate','abc');expect(view.props('ResultCard')).toBeDefined(); // 대출 0이면 금리는 적용하지 않는다.
 change('loanAmount','');expect(view.props('ResultCard')).toBeUndefined();
});
it('only active inputs must be filled',()=>{
 const state={used:{raw:'0',value:'0',error:''},hidden:{raw:'',value:'',error:''}};
 expect(hasMissingInput(state,['used'])).toBe(false);expect(hasMissingInput(state,['used','hidden'])).toBe(true);
});
it('all calculator initial copy has no internal identifiers and amount defaults are blank',async()=>{
 for(const file of readdirSync('src/components/calculator').filter(f=>f.endsWith('Calc.tsx'))){
  const {default:C}=await import(`../components/calculator/${file.replace(/\.tsx$/,'')}.tsx`);const view=uiHarness(C);
  expect(identifiers(visibleCopy(view.html())),file).toEqual([]);
  for(const n of view.nodes().filter(n=>n.props.suffix==='만원'&&'onChange' in n.props))expect(n.props.value,file).toBe('');
 }
});
it('particles follow consonants',()=>{expect(withParticle('이자','은/는')).toBe('이자는');expect(withParticle('금액','은/는')).toBe('금액은')});

it('toggle group exposes only the selected option',()=>{
 for(const value of ['a','b']) {
  const html=renderToStaticMarkup(createElement(ToggleGroup,{label:'계산 방식',value,options:[{value:'a',label:'방식 가'},{value:'b',label:'방식 나'}],onChange:()=>{}}));
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  expect(html.match(/aria-pressed="false"/g)).toHaveLength(1);
 }
});

it('required money fields do not retain optional-or-blank guidance',async()=>{
 for(const name of ['MovingCost','MonthlySurplus','CompoundSavings','InitialCost','Dsr']) {
  const {default:C}=await import(`../components/calculator/${name}Calc.tsx`);
  const text=visibleCopy(uiHarness(C).html()).replace(/\s+/g,' ');
  expect(text,name).not.toMatch(/비워\s*두|입력원/);
  expect(text,name).toMatch(/없으면 0|없는 항목은 0/);
  expect(text,name).not.toContain('만 필수');
 }
});
