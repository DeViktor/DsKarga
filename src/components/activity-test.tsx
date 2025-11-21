'use client';

import { useEffect } from 'react';
import { useActivityLogger, ActivityActions, ActivityTargets } from '@/hooks/use-activity-logger';

export function ActivityTest() {
  const { logActivity } = useActivityLogger();

  useEffect(() => {
    // Test the activity logging system
    const testActivity = async () => {
      try {
        await logActivity(
          ActivityActions.CREATE,
          'Sistema de Atividades',
          'service',
          { 
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Sistema de atividades em tempo real está funcionando!'
          }
        );
        console.log('✅ Atividade de teste registrada com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao registrar atividade de teste:', error);
      }
    };

    // Execute test after component mounts
    testActivity();
  }, [logActivity]);

  return null; // This component doesn't render anything
}