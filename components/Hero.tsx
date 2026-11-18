

import {supabase} from '@/lib/supabase';
import SearchBox from '@/components/SearchBox';
import HeroCarousel from '@/components/HeroCarousel';

export default async function Hero({items}:{items?:any[]}){
  const {data}=await supabase
    .from('site_settings')
    .select('key,value')
    .in('key',['hero_image','hero_new_image','hero_pleasure_image']);

  const settings=Object.fromEntries(
    (data||[]).map(item=>[item.key,item.value])
  );

  return (
    <HeroCarousel
      src={settings.hero_image||'/hero-beaute.jpg'}
      newSrc={settings.hero_new_image||''}
      pleasureSrc={settings.hero_pleasure_image||''}
      search={<SearchBox/>}
    />
  );
}
