"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon, QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Navigation } from '@/components/layout/Navigation';
import { useForm } from 'react-hook-form';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';

type FormData = {
    shopName: string;
    cardCode: string;
    notes: string;
};

type LoyaltyCard = {
    id: number;
    name: string;
    shopName: string;
    logoUrl: string | null;
    notes: string | null;
    cardType: 'BARCODE' | 'QRCODE';
    cardCode: string;
};

export default function EditCard() {
    const params = useParams();
    const router = useRouter();
    const [card, setCard] = useState<LoyaltyCard | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>();

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const res = await fetch(`/api/cards/${params.id}`);
                if (!res.ok) {
                    throw new Error('Erreur lors de la récupération de la carte');
                }
                const data = await res.json();
                setCard(data);
                reset({
                    shopName: data.shopName,
                    cardCode: data.cardCode,
                    notes: data.notes || '',
                });
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement de la carte:', error);
                setLoading(false);
            }
        };

        fetchCard();
    }, [params.id, reset]);

    useEffect(() => {
        // Créer l'élément audio
        audioRef.current = new Audio('/sounds/beep.mp3');

        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, []);

    const playBeepSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
                console.error('Erreur lors de la lecture du son:', error);
            });
        }
    };

    const startScanner = async () => {
        try {
            console.log("Démarrage du scanner...");
            codeReaderRef.current = new BrowserMultiFormatReader();
            const videoElement = videoRef.current;
            if (!videoElement) {
                console.error("Élément vidéo non trouvé");
                return;
            }

            setIsScanning(true);
            console.log("Scanner activé, recherche de l'appareil photo...");

            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
            console.log("Appareils vidéo disponibles:", videoInputDevices);

            if (videoInputDevices.length === 0) {
                console.error("Aucun appareil photo trouvé");
                setIsScanning(false);
                return;
            }

            const selectedDeviceId = videoInputDevices[0].deviceId;
            console.log("Appareil photo sélectionné:", selectedDeviceId);

            await codeReaderRef.current.decodeFromVideoDevice(
                selectedDeviceId,
                videoElement,
                (result) => {
                    if (result) {
                        console.log("Code détecté:", result.getText());
                        const code = result.getText();

                        // Éviter les doublons de scan
                        if (code === lastScannedCode) return;
                        setLastScannedCode(code);

                        // Jouer le son de notification
                        playBeepSound();

                        // Mettre à jour les champs du formulaire
                        setValue('cardCode', code);

                        // Détecter automatiquement le type de code
                        const format = result.getBarcodeFormat();
                        const formatString = format.toString();
                        setDetectedFormat(formatString);

                        console.log("Format détecté:", formatString);

                        // Liste des formats de codes-barres
                        const barcodeFormats = [
                            BarcodeFormat.EAN_13,
                            BarcodeFormat.EAN_8,
                            BarcodeFormat.CODE_128,
                            BarcodeFormat.CODE_39,
                            BarcodeFormat.CODE_93,
                            BarcodeFormat.UPC_A,
                            BarcodeFormat.UPC_E,
                            BarcodeFormat.ITF,
                            BarcodeFormat.CODABAR
                        ];

                        // Vérifier si c'est un code-barres
                        if (barcodeFormats.includes(format)) {
                            console.log("Code-barres détecté");
                            setValue('cardType', 'BARCODE');
                        } else if (formatString.includes('QR')) {
                            console.log("QR code détecté");
                            setValue('cardType', 'QRCODE');
                        }

                        // Arrêter le scan une fois qu'un code est détecté
                        if (codeReaderRef.current) {
                            codeReaderRef.current.reset();
                        }
                        setIsScanning(false);
                    }
                }
            );
            console.log("Scanner démarré avec succès");
        } catch (error) {
            console.error('Erreur lors de l\'accès à l\'appareil photo:', error);
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        console.log("Arrêt du scanner...");
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
        setIsScanning(false);
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/cards/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important pour envoyer les cookies
                body: JSON.stringify({
                    shopName: data.shopName,
                    cardCode: data.cardCode,
                    notes: data.notes || null
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de la carte');
            }

            // Redirection vers la page de détail après succès
            router.push(`/cards/${params.id}`);
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de la carte:', error);
            alert(error.message || 'Une erreur est survenue lors de la mise à jour de la carte');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/cards/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la carte');
            }

            router.push('/');
        } catch (error) {
            console.error('Erreur lors de la suppression de la carte:', error);
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            <header className="bg-blue text-white p-4 flex items-center shadow-md">
                <button onClick={() => router.back()} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Modifier la carte</h1>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="ml-auto text-white"
                    aria-label="Supprimer la carte"
                >
                    <TrashIcon className="w-6 h-6" />
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="p-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du magasin
                            </label>
                            <input
                                id="shopName"
                                type="text"
                                className={`input ${errors.shopName ? 'border-red-500' : ''}`}
                                {...register('shopName', { required: 'Ce champ est requis' })}
                            />
                            {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="cardCode" className="block text-sm font-medium text-gray-700 mb-1">
                                Code de la carte
                            </label>
                            <div className="relative">
                                <input
                                    id="cardCode"
                                    type="text"
                                    className={`input pr-10 ${errors.cardCode ? 'border-red-500' : ''}`}
                                    {...register('cardCode', { required: 'Ce champ est requis' })}
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-2 text-gray-500 hover:text-blue-600"
                                    onClick={() => {
                                        console.log("Bouton appareil photo cliqué, isScanning:", isScanning);
                                        if (isScanning) {
                                            stopScanner();
                                        } else {
                                            startScanner();
                                        }
                                    }}
                                >
                                    <CameraIcon className="w-6 h-6" />
                                </button>
                            </div>
                            {errors.cardCode && <p className="text-red-500 text-xs mt-1">{errors.cardCode.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optionnel)
                            </label>
                            <textarea
                                id="notes"
                                className="input min-h-[100px]"
                                {...register('notes')}
                            ></textarea>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="btn-primary w-full py-3 text-lg font-medium"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Enregistrement...
                                    </div>
                                ) : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Scanner de code-barres/QR code */}
            {isScanning && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 w-full max-w-md">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full rounded-lg"
                                style={{ maxHeight: '70vh' }}
                            ></video>
                            <button
                                onClick={() => {
                                    console.log("Bouton fermer cliqué");
                                    stopScanner();
                                }}
                                className="absolute top-2 right-2 bg-blue text-white p-2 rounded-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {detectedFormat && (
                                <div className="absolute top-2 left-2 bg-blue text-white px-2 py-1 rounded text-xs">
                                    {detectedFormat.includes('QR') ? 'QR Code détecté' : 'Code-barres détecté'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Affichage du code scanné */}
            {!isScanning && lastScannedCode && (
                <div className="mb-6 bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                            {detectedFormat?.includes('QR') ? (
                                <QrCodeIcon className="w-6 h-6 text-blue" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-medium">{detectedFormat?.includes('QR') ? 'QR Code' : 'Code-barres'} détecté</p>
                            <p className="text-sm text-gray-500">Code: {lastScannedCode}</p>
                        </div>
                    </div>
                    <button
                        onClick={startScanner}
                        className="bg-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                    >
                        Scanner à nouveau
                    </button>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Confirmation de suppression</h2>
                        <p className="text-gray-600 mb-6">
                            Êtes-vous sûr de vouloir supprimer cette carte de fidélité ? Cette action est irréversible.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navigation />
        </div>
    );
} 