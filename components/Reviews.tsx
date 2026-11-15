import Stars from '@/components/Stars';
export default function Reviews({list,avg}:{list:any[];avg:number}){
return <section id="avis" className="mt-12 border-t border-sand pt-8"><h2 className="font-serif text-3xl text-plum">Avis clients</h2>
{list.length===0?<p className="mt-2 text-sm text-ink/60">Aucun avis pour le moment. Les clientes peuvent noter leurs produits après la livraison.</p>:<><p className="mt-2 flex items-center gap-3"><Stars v={avg} size={22}/><span className="text-sm"><b>{avg.toFixed(1)}</b> sur 5 · {list.length} avis</span></p>
<ul className="mt-5 space-y-4">{list.map((r,i)=><li key={i} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><Stars v={r.rating}/><span className="text-xs text-ink/50">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span></div>{r.comment&&<p className="mt-2 text-sm">{r.comment}</p>}<p className="mt-2 text-xs text-ink/60">{r.customer_name} · achat vérifié</p></li>)}</ul></>}</section>}
