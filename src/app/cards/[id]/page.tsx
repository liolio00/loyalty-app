"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Navigation } from '@/components/layout/Navigation';
import Link from 'next/link';

// Pour les codes-barres et QR codes
import JsBarcode from 'jsbarcode';
import { QRCode } from 'react-qrcode-logo';

type LoyaltyCard = {
    id: number;
    name: string;
    shopName: string;
    logoUrl: string | null;
    notes: string | null;
    cardType: 'BARCODE' | 'QRCODE';
    cardCode: string;
};

export default function CardDetails() {
    const params = useParams();
    const router = useRouter();
    const [card, setCard] = useState<LoyaltyCard | null>(null);
    const [loading, setLoading] = useState(true);
    const [brightness, setBrightness] = useState(true); // Luminosité maximale par défaut
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const res = await fetch(`/api/cards/${params.id}`);
                if (!res.ok) {
                    throw new Error('Erreur lors de la récupération de la carte');
                }
                const data = await res.json();
                setCard(data);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement de la carte:', error);
                setLoading(false);
            }
        };

        fetchCard();
    }, [params.id]);

    // Générer le code-barres lorsque la carte est chargée
    useEffect(() => {
        if (card && card.cardType === 'BARCODE' && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, card.cardCode, {
                    format: "CODE128",
                    width: 3,
                    height: 150,
                    displayValue: false,
                    background: "#FFFFFF",
                    lineColor: "#000000",
                    margin: 10,
                });
            } catch (error) {
                console.error('Erreur lors de la génération du code-barres:', error);
            }
        }
    }, [card]);

    // Appliquer la luminosité maximale au chargement
    useEffect(() => {
        document.body.style.backgroundColor = 'white';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    return (
        <div className="min-h-screen pb-20 bg-white">
            <header className="bg-blue text-white p-4 flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Détails de la carte</h1>
                {card && (
                    <Link href={`/cards/${params.id}/edit`} className="p-2">
                        <PencilIcon className="w-6 h-6" />
                    </Link>
                )}
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : card ? (
                <div className="p-4">
                    <div className="card mb-6 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-light-blue flex items-center justify-center mb-3">
                            <span className="text-2xl font-bold text-blue">
                                {card.shopName.charAt(0)}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-center">{card.shopName}</h2>
                        {card.notes && (
                            <div className="mt-3 p-3 bg-cream rounded-lg w-full">
                                <p className="text-gray-700">{card.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Zone du code-barres/QR code avec luminosité maximale */}
                    <div className="card p-6 flex flex-col items-center bg-white">
                        {card.cardType === 'BARCODE' ? (
                            <div className="w-full max-w-full">
                                <svg ref={barcodeRef} className="w-full h-auto"></svg>
                                <p className="text-center mt-4 font-mono text-lg">{card.cardCode}</p>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center">
                                <QRCode
                                    value={card.cardCode}
                                    size={300}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                    qrStyle="dots"
                                />
                            </div>
                        )}
                    </div>

                    {/* Affichage des notes */}
                    {card.notes && (
                        <div className="card mt-6 p-4">
                            <h3 className="font-semibold text-blue mb-2">Notes</h3>
                            <p className="text-gray-700 whitespace-pre-line">{card.notes}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 text-center">
                    <p className="text-gray-500">Carte non trouvée</p>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-primary mt-4"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            )}

            <Navigation />
        </div>
    );
} 