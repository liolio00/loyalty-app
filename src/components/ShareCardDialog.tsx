"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ShareCardDialogProps = {
    cards: Array<{
        id: string;
        shopName: string;
    }>;
    onShareComplete: () => void;
};

type Share = {
    id: string;
    sharedWithUser: {
        email: string;
    };
};

export function ShareCardDialog({ cards, onShareComplete }: ShareCardDialogProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [step, setStep] = useState<'select' | 'email'>('select');

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !user || selectedCards.size === 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/cards/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    cardIds: Array.from(selectedCards)
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors du partage des cartes');
            }

            if (data.isNewUser) {
                toast.success('Un email d\'invitation a été envoyé à l\'utilisateur');
            } else {
                toast.success('Les cartes ont été ajoutées à la liste de l\'utilisateur');
            }

            setEmail('');
            setSelectedCards(new Set());
            onShareComplete();
            setIsOpen(false);
            setStep('select');
        } catch (error) {
            console.error('Erreur lors du partage:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors du partage des cartes');
        } finally {
            setLoading(false);
        }
    };

    const toggleCard = (cardId: string) => {
        const newSelectedCards = new Set(selectedCards);
        if (newSelectedCards.has(cardId)) {
            newSelectedCards.delete(cardId);
        } else {
            newSelectedCards.add(cardId);
        }
        setSelectedCards(newSelectedCards);
    };

    const toggleAllCards = () => {
        if (!Array.isArray(cards)) return;

        if (selectedCards.size === cards.length) {
            // Si toutes les cartes sont déjà sélectionnées, on les désélectionne toutes
            setSelectedCards(new Set());
        } else {
            // Sinon, on sélectionne toutes les cartes
            setSelectedCards(new Set(cards.map(card => card.id)));
        }
    };

    const handleNext = () => {
        if (selectedCards.size > 0) {
            setStep('email');
        } else {
            toast.error('Veuillez sélectionner au moins une carte');
        }
    };

    const handleBack = () => {
        setStep('select');
    };

    const handleClose = () => {
        setIsOpen(false);
        setStep('select');
        setSelectedCards(new Set());
        setEmail('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <span>Partager</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-none">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {step === 'select' ? 'Sélectionner des cartes à partager' : 'Partager avec un utilisateur'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {step === 'select'
                            ? 'Sélectionnez une ou plusieurs cartes que vous souhaitez partager.'
                            : 'Entrez l\'adresse email de la personne avec qui vous souhaitez partager ces cartes.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' ? (
                    <div className="space-y-4 py-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-md mb-3 border border-blue-200">
                            <div className="flex items-center space-x-3 p-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedCards.size === cards.length}
                                    onCheckedChange={toggleAllCards}
                                />
                                <Label htmlFor="select-all" className="font-medium cursor-pointer text-gray-800">
                                    Sélectionner toutes les cartes
                                </Label>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3 bg-white shadow-sm">
                            {!Array.isArray(cards) || cards.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>Vous n'avez pas de cartes à partager</p>
                                </div>
                            ) : (
                                cards.map((card) => (
                                    <div key={card.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                                        <Checkbox
                                            id={card.id}
                                            checked={selectedCards.has(card.id)}
                                            onCheckedChange={() => toggleCard(card.id)}
                                        />
                                        <Label htmlFor={card.id} className="flex-1 cursor-pointer text-gray-700">
                                            {card.shopName}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <Badge variant="outline" className="text-sm bg-gray-50 text-gray-600 border-gray-200">
                                {selectedCards.size} carte{selectedCards.size !== 1 ? 's' : ''} sélectionnée{selectedCards.size !== 1 ? 's' : ''}
                            </Badge>
                            <Button
                                onClick={handleNext}
                                disabled={selectedCards.size === 0}
                                className="ml-auto btn-primary bg-blue hover:bg-light-blue-alt transform transition-all hover:scale-105"
                            >
                                Suivant
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleShare} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                                <Mail className="h-4 w-4" />
                                <span>Email du destinataire</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemple.com"
                                required
                                className="w-full border-gray-200 focus:border-blue focus:ring-blue"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-md border border-blue-200">
                            <h4 className="text-sm font-medium mb-2 text-gray-800">Cartes sélectionnées :</h4>
                            <div className="space-y-1">
                                {Array.from(selectedCards).map(cardId => {
                                    const card = cards.find(c => c.id === cardId);
                                    return card ? (
                                        <div key={cardId} className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-gray-700">{card.shopName}</span>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>

                        <Separator className="bg-gray-200" />

                        <DialogFooter className="flex justify-between pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="btn-primary bg-blue hover:bg-light-blue-alt transform transition-all hover:scale-105"
                            >
                                {loading ? 'Partage en cours...' : 'Partager'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
} 