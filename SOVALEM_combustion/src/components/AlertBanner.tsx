import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Props {
    sh5Temp: number;
    o2: number;
    barycenter: number;
    onHelp: (topic: string) => void;
}

export const AlertBanner: React.FC<Props> = React.memo(({ sh5Temp, o2, barycenter, onHelp }) => {
    // Determine alert level
    const getAlertLevel = () => {
        if (sh5Temp > 640) {
            return {
                level: 'critical',
                message: '🚨 ALERTE CRITIQUE: SH5 > 640°C - Réduire l\'air primaire immédiatement!',
                action: 'Baisser AP Zone 1-2 ou augmenter Air Secondaire',
                bgColor: 'bg-red-600',
                textColor: 'text-white',
                icon: XCircle
            };
        }
        if (sh5Temp > 620) {
            return {
                level: 'warning',
                message: '⚠️ ATTENTION: SH5 > 620°C - Surveiller la température',
                action: 'Vérifier le barycentre, répartir la combustion',
                bgColor: 'bg-orange-500',
                textColor: 'text-white',
                icon: AlertTriangle
            };
        }
        if (o2 < 5) {
            return {
                level: 'warning',
                message: '⚠️ O2 bas (< 5%) - Risque d\'imbrûlés',
                action: 'Augmenter l\'air primaire ou réduire l\'alimentation',
                bgColor: 'bg-amber-500',
                textColor: 'text-white',
                icon: AlertTriangle
            };
        }
        if (barycenter > 4.5) {
            return {
                level: 'warning',
                message: '⚠️ Feu qui descend - Barycentre > 4.5',
                action: 'Réduire AP Zone 5-6, augmenter Zone 1-2',
                bgColor: 'bg-orange-500',
                textColor: 'text-white',
                icon: AlertTriangle
            };
        }
        if (barycenter < 2.0) {
            return {
                level: 'info',
                message: '💡 Feu en avant - Barycentre < 2.0',
                action: 'Augmenter AP Zone 3-4 pour repousser le feu',
                bgColor: 'bg-blue-500',
                textColor: 'text-white',
                icon: AlertTriangle
            };
        }
        return {
            level: 'ok',
            message: '✓ Fonctionnement normal - Tous les paramètres sont dans les cibles',
            action: '',
            bgColor: 'bg-emerald-500',
            textColor: 'text-white',
            icon: CheckCircle
        };
    };

    const alert = getAlertLevel();
    const Icon = alert.icon;

    return (
        <div
            className={`${alert.bgColor} ${alert.textColor} px-4 py-2 rounded-xl mb-4 flex items-center justify-between cursor-help transition-all hover:opacity-90`}
            onClick={() => onHelp('alerts')}
        >
            <div className="flex items-center gap-3">
                <Icon size={20} />
                <div>
                    <span className="font-bold text-sm">{alert.message}</span>
                    {alert.action && (
                        <span className="text-xs opacity-90 ml-2">→ {alert.action}</span>
                    )}
                </div>
            </div>
            <span className="text-[10px] opacity-75 uppercase tracking-wider">Cliquer pour aide</span>
        </div>
    );
});
