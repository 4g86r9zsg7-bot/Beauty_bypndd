import {WhatsAppIcon,InstagramIcon} from '@/components/SocialIcons';import {IG} from '@/lib/shop';
export const metadata={title:'Contact | Beauty_bypndd',description:'Contactez Beauty_bypndd par WhatsApp ou Instagram pour une question, une commande ou une précommande.'};
export default function Contact(){
const wa=process.env.NEXT_PUBLIC_WHATSAPP||'';
return <div className="mx-auto max-w-md space-y-6 text-center"><h1 className="font-serif text-4xl text-plum">Contact</h1>
<p>Une question, une commande ou une précommande ? Écrivez-nous, nous répondons dès que possible.</p>
<div className="flex justify-center gap-10 text-sm">
{wa&&<a href={`https://wa.me/${wa}?text=${encodeURIComponent('Bonjour, j’ai une question.')}`} aria-label="Écrire sur WhatsApp" className="flex flex-col items-center gap-2"><WhatsAppIcon size={72}/>WhatsApp</a>}
<a href={IG} aria-label="Voir notre Instagram" className="flex flex-col items-center gap-2"><InstagramIcon size={72}/>Instagram</a></div></div>}
