"use client";

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
    value: string;
    options?: {
        format?: string;
        width?: number;
        height?: number;
        displayValue?: boolean;
        text?: string;
        fontOptions?: string;
        font?: string;
        textAlign?: string;
        textPosition?: string;
        textMargin?: number;
        fontSize?: number;
        background?: string;
        lineColor?: string;
        margin?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
    };
}

export const Barcode: React.FC<BarcodeProps> = ({ value, options = {} }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, value, {
                    format: 'CODE128',
                    width: 2,
                    height: 100,
                    displayValue: true,
                    background: '#ffffff',
                    lineColor: '#000000',
                    margin: 10,
                    fontSize: 16,
                    ...options,
                });
            } catch (error) {
                console.error('Erreur lors de la génération du code-barres:', error);
            }
        }
    }, [value, options]);

    return (
        <svg ref={barcodeRef} className="w-full"></svg>
    );
}; 