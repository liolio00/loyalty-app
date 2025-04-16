"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Share2 } from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { ShareCardDialog } from '@/components/ShareCardDialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast"
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLogoUrl } from '@/lib/utils/logoMapping';

type LoyaltyCard = {
  id: string;
  name: string | null;
  shopName: string;
  logoUrl: string | null;
  cardType: 'BARCODE' | 'QRCODE';
  cardCode: string;
  createdAt: Date;
  shares?: {
    id: string;
    sharedWithUser: {
      email: string;
    };
  }[];
  cardSource: 'owned' | 'shared';
  sharedByEmail?: string;
};

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredCards, setFilteredCards] = useState<LoyaltyCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<LoyaltyCard | null>(null);
  const { toast } = useToast()

  const fetchCards = async () => {
    try {
      console.log('Début de la récupération des cartes');
      const res = await fetch('/api/cards');
      console.log('Réponse de l\'API:', res.status);
      if (!res.ok) {
        throw new Error('Erreur lors de la récupération des cartes');
      }
      const data = await res.json();
      console.log('Données reçues:', data);

      // Extraire les cartes de la réponse
      const cardsData = Array.isArray(data.cards) ? data.cards : [];
      setCards(cardsData);
      setFilteredCards(cardsData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes:', error);
      setCards([]);
      setFilteredCards([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('Utilisateur connecté, chargement des cartes');
      fetchCards();
    }
  }, [user]);

  useEffect(() => {
    const filtered = cards.filter(card =>
      card.shopName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) =>
      a.shopName.localeCompare(b.shopName)
    );
    setFilteredCards(sorted);
  }, [cards, searchTerm]);

  const handleDeleteCard = async (card: LoyaltyCard) => {
    setCardToDelete(card);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      const res = await fetch(`/api/cards/${cardToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression de la carte');
      }

      toast({
        title: "Succès",
        description: "La carte a été supprimée avec succès",
        variant: "default",
      });
      setShowDeleteConfirm(false);
      setCardToDelete(null);
      fetchCards();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la carte",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete card')
      }
      toast({
        title: "Succès",
        description: "La carte a été supprimée avec succès",
        variant: "default",
      })
      fetchCards()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la carte",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes cartes de fidélité</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <ShareCardDialog
              cards={cards.map(card => ({ id: card.id, shopName: card.shopName }))}
              onShareComplete={fetchCards}
            />
            <Link
              href="/add-card"
              className="btn-primary bg-blue hover:bg-light-blue-alt transform transition-all hover:scale-105 text-center flex-1 sm:flex-none"
            >
              Ajouter une carte
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            />
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="text-center py-10 animate-fade-in bg-white rounded-lg shadow-sm">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-10 h-10 text-blue" />
            </div>
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de cartes de fidélité</p>
            <Link
              href="/add-card"
              className="btn-primary bg-blue hover:bg-light-blue-alt transform transition-all hover:scale-105 inline-block"
            >
              Ajouter ma première carte
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer relative ${card.cardSource === 'shared' ? 'border-2 border-blue bg-blue-50' : ''
                  }`}
                onClick={() => setSelectedCard(card)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 max-w-[70%]">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100"
                    >
                      {card.logoUrl ? (
                        <Image
                          src={card.logoUrl}
                          alt={`Logo ${card.shopName}`}
                          width={48}
                          height={48}
                          className="object-cover"
                          onError={(e) => {
                            // En cas d'erreur de chargement, afficher l'initiale
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const initial = document.createElement('span');
                              initial.className = 'text-lg font-semibold text-gray-600';
                              initial.textContent = card.shopName.charAt(0).toUpperCase();
                              parent.appendChild(initial);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          {card.shopName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{card.shopName}</h3>
                      <div className="flex items-center gap-2">
                        {card.cardSource === 'shared' && (
                          <span className="text-sm text-blue-600 flex items-center gap-1 truncate">
                            <Share2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Partagée par {card.sharedByEmail}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {card.cardSource === 'owned' && (
                      <>
                        <ShareCardDialog
                          cards={cards.map(c => ({ id: c.id, shopName: c.shopName }))}
                          onShareComplete={fetchCards}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-50 rounded p-2 text-sm font-mono truncate">
                      {card.cardCode}
                    </div>
                  </div>
                  {card.cardSource === 'owned' && card.shares && card.shares.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Partagé avec :</p>
                      <ul className="list-disc list-inside">
                        {card.shares.map((share, i) => (
                          <li key={i} className="truncate">{share.sharedWithUser.email}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedCard.shopName}</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Code {selectedCard.cardType === 'BARCODE' ? 'barres' : 'QR'}</p>
                <div className="text-lg font-mono break-all mb-4">{selectedCard.cardCode}</div>
                {selectedCard.cardType === 'QRCODE' ? (
                  <div className="flex justify-center">
                    <QRCodeSVG value={selectedCard.cardCode} size={200} />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <img
                      src={`https://barcodeapi.org/api/code128/${selectedCard.cardCode}`}
                      alt="Code-barres"
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
              </div>
              {selectedCard.name && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700">{selectedCard.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Supprimer la carte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer cette carte ?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </main>
  );
}
