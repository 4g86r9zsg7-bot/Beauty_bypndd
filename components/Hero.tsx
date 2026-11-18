
import {supabase} from '@/lib/supabase';
import HeroCarousel from '@/components/HeroCarousel';

export default async function Hero({items}:{items?:any[]}){
  const {data:cfg}=await supabase
    .from('site_settings')
    .select('value')
    .eq('key','hero_image')
    .maybeSingle();

  const src:string=cfg?.value||'/hero-beaute.jpg';

  return <HeroCarousel src={src}/>;
}
