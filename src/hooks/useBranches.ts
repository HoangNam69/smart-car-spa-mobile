import { useState, useEffect } from "react";
import { branchService, Branch } from "../services/branchService";

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await branchService.getAllBranches();
        setBranches(result.branches);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch branches")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, loading, error };
};
