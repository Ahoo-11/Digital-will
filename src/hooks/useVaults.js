import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function transformVaultRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    ownerId: row.owner_id,
    vaultId: row.vault_id,
    encryptedData: row.encrypted_payload,
    lockTime: row.lock_time ? Math.floor(new Date(row.lock_time).getTime() / 1000) : null,
    lockTimeDays: row.lock_days,
    heirAddresses: Array.isArray(row.heirs) ? row.heirs : [],
    network: row.network,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    metadata: row.metadata || null,
  };
}

export function useVaults(user) {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVaults = useCallback(async () => {
    if (!user) {
      setVaults([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('digitalwill_vaults')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch vaults:', fetchError);
      setError(fetchError.message);
      setVaults([]);
    } else {
      setVaults(data.map(transformVaultRow).filter(Boolean));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const createVault = useCallback(
    async (vault) => {
      if (!user) {
        throw new Error('User is not authenticated');
      }

      const payload = {
        owner_id: user.id,
        vault_id: vault.vaultId,
        encrypted_payload: vault.encryptedData,
        lock_time: new Date(vault.lockTime * 1000).toISOString(),
        lock_days: vault.lockTimeDays,
        heirs: vault.heirAddresses,
        network: vault.network,
        status: 'draft',
        metadata: vault.metadata ?? null,
      };

      const { data, error: insertError } = await supabase
        .from('digitalwill_vaults')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to save vault:', insertError);
        throw new Error(insertError.message);
      }

      const transformed = transformVaultRow(data);
      setVaults((prev) => [transformed, ...prev.filter((v) => v.vaultId !== transformed.vaultId)]);
      return transformed;
    },
    [user]
  );

  const deleteVault = useCallback(
    async (vault) => {
      if (!user || !vault) {
        return;
      }

      const query = supabase.from('digitalwill_vaults').delete();

      if (vault.id) {
        query.eq('id', vault.id);
      } else {
        query.eq('vault_id', vault.vaultId);
      }

      const { error: deleteError } = await query;
      if (deleteError) {
        console.error('Failed to delete vault:', deleteError);
        throw new Error(deleteError.message);
      }

      setVaults((prev) => prev.filter((item) => item.vaultId !== vault.vaultId));
    },
    [user]
  );

  const updateVault = useCallback(
    async (vaultId, updates) => {
      if (!user) {
        throw new Error('User is not authenticated');
      }

      const dbUpdates = {};

      if (updates.status) dbUpdates.status = updates.status;
      if (updates.lockTime) dbUpdates.lock_time = new Date(updates.lockTime * 1000).toISOString();
      if (updates.metadata) dbUpdates.metadata = updates.metadata;

      const { data, error: updateError } = await supabase
        .from('digitalwill_vaults')
        .update(dbUpdates)
        .eq('vault_id', vaultId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update vault:', updateError);
        throw new Error(updateError.message);
      }

      const transformed = transformVaultRow(data);
      setVaults((prev) => prev.map((item) => (item.vaultId === vaultId ? transformed : item)));
      return transformed;
    },
    [user]
  );

  return {
    vaults,
    loading,
    error,
    refresh: fetchVaults,
    createVault,
    deleteVault,
    updateVault,
  };
}
