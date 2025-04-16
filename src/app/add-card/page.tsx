"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CameraIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { Navigation } from '@/components/layout/Navigation';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import { useAuth } from '@/lib/auth/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
    shopName: z.string().min(1, "Le nom du magasin est requis"),
    cardType: z.enum(["BARCODE", "QRCODE"]),
    cardCode: z.string().min(1, "Le code de la carte est requis"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddCard() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cardType: "BARCODE",
        },
    });

    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Créer l'élément audio
        audioRef.current = new Audio('/sounds/beep.mp3');

        codeReaderRef.current = new BrowserMultiFormatReader();

        // Lancer automatiquement le scan à l'ouverture de la page
        if (user) {
            startScanning();
        }

        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, [user]);

    const playBeepSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
                console.error('Erreur lors de la lecture du son:', error);
            });
        }
    };

    const startScanning = async () => {
        try {
            if (!codeReaderRef.current) return;

            // Réinitialiser le scanner avant de le redémarrer
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }

            setIsInitializing(true);
            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                console.error("Aucune caméra trouvée");
                return;
            }

            const selectedDeviceId = videoInputDevices[0].deviceId;
            await codeReaderRef.current.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current!,
                (result) => {
                    if (result) {
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
                        console.log("Est-ce un QR code?", formatString.includes('QR'));

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

                        // Liste des formats de QR codes
                        const qrFormats = [
                            BarcodeFormat.QR_CODE,
                            BarcodeFormat.MICRO_QR_CODE,
                            BarcodeFormat.AZTEC,
                            BarcodeFormat.DATA_MATRIX
                        ];

                        // Vérifier si c'est un code-barres
                        if (barcodeFormats.includes(format)) {
                            console.log("Code-barres détecté");
                            setValue('cardType', 'BARCODE');
                        } else if (qrFormats.includes(format) || formatString.includes('QR')) {
                            console.log("QR code détecté");
                            setValue('cardType', 'QRCODE');
                        } else {
                            console.log("Format non reconnu, par défaut: BARCODE");
                            setValue('cardType', 'BARCODE');
                        }

                        // Arrêter le scan une fois qu'un code est détecté
                        if (codeReaderRef.current) {
                            codeReaderRef.current.reset();
                        }
                        setIsScanning(false);
                    }
                }
            );
            setIsScanning(true);
            setIsInitializing(false);
        } catch (error) {
            console.error("Erreur lors de l'accès à la caméra:", error);
            setIsScanning(false);
            setIsInitializing(false);
        }
    };

    const stopScanning = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
            setIsScanning(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!user) {
            setError('Vous devez être connecté pour ajouter une carte');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include', // Important pour envoyer les cookies
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    router.push('/login');
                    throw new Error('Session expirée, veuillez vous reconnecter');
                }
                throw new Error(errorData.message || 'Erreur lors de l\'ajout de la carte');
            }

            // Rediriger vers la page d'accueil après la création
            router.push('/');
        } catch (error: any) {
            console.error('Erreur lors de l\'ajout de la carte:', error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour ajouter automatiquement la carte après détection du code
    const handleCodeDetected = async (code: string, format: string) => {
        if (!user) {
            setError('Vous devez être connecté pour ajouter une carte');
            return;
        }

        const shopName = watch('shopName');
        if (!shopName) {
            setError('Veuillez entrer le nom du magasin');
            // Arrêter le scan et afficher un message d'erreur
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            setIsScanning(false);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Déterminer le type de carte
            let cardType = 'BARCODE';
            if (format.includes('QR') || qrFormats.includes(format)) {
                cardType = 'QRCODE';
            }

            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shopName,
                    cardType,
                    cardCode: code
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    router.push('/login');
                    throw new Error('Session expirée, veuillez vous reconnecter');
                }
                throw new Error(errorData.message || 'Erreur lors de l\'ajout de la carte');
            }

            // Rediriger vers la page d'accueil après la création
            router.push('/');
        } catch (error: any) {
            console.error('Erreur lors de l\'ajout de la carte:', error);
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Si le chargement est en cours, afficher un indicateur de chargement
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Si l'utilisateur n'est pas connecté, ne rien afficher (la redirection sera gérée par useEffect)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            <header className="bg-blue text-white p-4 flex items-center shadow-md">
                <button onClick={() => router.back()} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Ajouter une carte</h1>
            </header>

            <div className="p-4 max-w-md mx-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
                    <div>
                        <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du magasin <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="shopName"
                            type="text"
                            className={`input w-full ${errors.shopName ? 'border-red-500' : ''}`}
                            placeholder="Ex: Carrefour"
                            {...register('shopName', { required: 'Ce champ est obligatoire' })}
                        />
                        {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName.message}</p>}
                    </div>

                    {/* Type de carte caché */}
                    <input
                        type="hidden"
                        {...register('cardType')}
                    />

                    {/* Code de carte caché */}
                    <input
                        type="hidden"
                        {...register('cardCode')}
                    />

                    <div className="mb-6">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                                style={{ display: isScanning ? 'block' : 'none' }}
                            />
                            {isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="border-4 border-red-500 p-8 rounded-lg w-3/4 h-1/2">
                                    </div>
                                </div>
                            )}
                            {isInitializing && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                type="button"
                                onClick={isScanning ? stopScanning : startScanning}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {isScanning ? 'Arrêter le scan' : 'Scanner un code'}
                            </button>
                        </div>
                    </div>

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
                                onClick={startScanning}
                                className="bg-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                            >
                                Scanner à nouveau
                            </button>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-lg font-medium"
                            disabled={isSubmitting || !lastScannedCode}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Enregistrement...
                                </div>
                            ) : 'Ajouter la carte'}
                        </button>
                    </div>

                    {isSubmitting && (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </form>
            </div>

            <Navigation />
        </div>
    );
} 