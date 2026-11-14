export const metadata={title:'Contact | Beauty_bypndd',description:'Contactez Beauty_bypndd par WhatsApp ou Instagram pour une question, une commande ou une précommande.'};
export default function Contact(){
const wa=process.env.NEXT_PUBLIC_WHATSAPP||'';const ig=process.env.NEXT_PUBLIC_INSTAGRAM||'';
const btn="block rounded-full py-4 text-center text-xs uppercase tracking-[0.2em] font-semibold";
return <div className="mx-auto max-w-md space-y-4 text-center"><h1 className="font-serif text-4xl text-plum">Contact</h1>
<p>Une question, une commande ou une précommande ? Écrivez-nous, nous répondons dès que possible.</p>
{wa&&<a href={`https://wa.me/${wa}?text=${encodeURIComponent('Bonjour, j’ai une question.')}`} className={`${btn} bg-rose text-white`}>Écrire sur WhatsApp</a>}
{ig&&<a href={ig} className={`${btn} border border-plum text-plum`}>Instagram</a>}</div>}
