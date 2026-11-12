'use client';import Link from 'next/link';import {useCart} from '@/lib/cart';
export default function CartLink(){const {count}=useCart();return <Link href="/panier" className="text-sm border border-ink rounded-full px-4 py-1.5">Panier ({count})</Link>}
