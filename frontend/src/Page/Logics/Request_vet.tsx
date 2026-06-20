import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { items } from "../../menudata/SidebarMenuItem";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";

type VetCardAPI = {
  vid: string;
  name?: string; // backend returns vid, name mapped from v.vname in router
  clinic?: string | null;
  specialization?: string | null;
  phone?: string | null;
  short_address?: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function VetListView() {
  const [vets, setVets] = useState<VetCardAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // pagination
  const PER_PAGE = 12;
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const fetchVets = async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch all vets; we'll paginate client-side
       const res = await fetch(`${API_BASE}/api/vet/appointments/vets`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.detail || json?.message || `Failed to fetch vets (${res.status})`);
        }
        const data = (await res.json()) as VetCardAPI[];
        if (mounted) {
          setVets(data || []);
          setPage(1); // reset to first page on new data
        }
      } catch (err: any) {
        console.error("Error fetching vets:", err);
        if (mounted) setError(err?.message || "Failed to fetch vets");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVets();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredVets = useMemo(() => {
    if (!search.trim()) return vets;
    const q = search.toLowerCase();
    return vets.filter(
      (v) =>
        (v.name || "").toLowerCase().includes(q) ||
        (v.specialization || "").toLowerCase().includes(q) ||
        (v.clinic || "").toLowerCase().includes(q)
    );
  }, [vets, search]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredVets.length / PER_PAGE));
  }, [filteredVets.length]);

  // clamp page if vets length changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedVets = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredVets.slice(start, start + PER_PAGE);
  }, [filteredVets, page]);

  const cardVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.06,
        duration: 0.4,
      },
    }),
  } as any;

  const handleRequest = (vid: string) => {
    // store vet id so appointment form can auto-fill it
    localStorage.setItem("vet_id", vid);
    // navigate to appointment_request page (also pass via query param)
    navigate(`/Appointment_info?v=${encodeURIComponent(vid)}`);
  };

  const gotoPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // helper to render page buttons (show all for small counts)
  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 7; // show up to 7 buttons with ellipsis
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      // always show 1, ... neighbors around current, ..., last
      const left = Math.max(2, page - 2);
      const right = Math.min(totalPages - 1, page + 2);

      buttons.push(1);
      if (left > 2) buttons.push(-1); // -1 as left ellipsis
      for (let i = left; i <= right; i++) buttons.push(i);
      if (right < totalPages - 1) buttons.push(-2); // -2 as right ellipsis
      buttons.push(totalPages);
    }

    return buttons.map((p, idx) => {
      if (p === -1 || p === -2) {
        return (
          <span key={`ell-${idx}`} className="px-2 py-1 text-sm text-muted-foreground">…</span>
        );
      }
      const isActive = p === page;
      return (
        <Button
          key={p}
          onClick={() => gotoPage(p)}
          className={`px-3 py-1 text-sm ${isActive ? "bg-primary text-white" : "bg-background"}`}
        >
          {p}
        </Button>
      );
    });
  };

  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10"
          >
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold ml-4">🩺 Available Vets</h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          {/* Main */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-1 flex-col gap-4 p-6 pt-6 bg-background min-h-screen"
          >
            <div className="max-w-7xl w-full mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose a vet to request an appointment</h2>
                <div className="text-sm text-muted-foreground">
                  {loading
                    ? "Loading vets..."
                    : error
                    ? `Error: ${error}`
                    : `${vets.length} vets • page ${page} of ${totalPages}`}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, specialization, or clinic..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 pr-9 h-10"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(""); setPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {search && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {filteredVets.length === 0 ? "No vets match your search" : `${filteredVets.length} vet${filteredVets.length !== 1 ? "s" : ""} found`}
                  </p>
                )}
              </div>

              {/* Grid */}
              <motion.div
                initial="hidden"
                animate="visible"
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {loading && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">Loading vets...</div>
                )}

                {error && (
                  <div className="col-span-full text-center text-sm text-red-600">{error}</div>
                )}

                {!loading && !error && filteredVets.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{search ? `No vets match "${search}"` : "No vets available."}</p>
                    {search && <button onClick={() => setSearch("")} className="mt-2 text-sm text-primary hover:underline">Clear search</button>}
                  </div>
                )}

                {pagedVets.map((v, i) => {
                  const name = (v.name || (v as any).name || (v as any).vid) as string;
                  const specialization = v.specialization || "General";
                  const clinic = v.clinic || "—";
                  const phone = v.phone || "—";
                  const addr = v.short_address || "";
                  return (
                    <motion.div
                      key={v.vid}
                      custom={i}
                      variants={cardVariant}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border bg-card">
                  <div className="w-full h-36 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                            {name?.slice(0, 1).toUpperCase() || "V"}
                          </div>
                        </div>

                        <CardHeader className="pt-4 pb-0">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{specialization}</p>
                        </CardHeader>

                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Clinic:</span> {clinic}
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span> {phone}
                          </p>
                          {addr && (
                            <p className="truncate">
                              <span className="font-medium">Address:</span> {addr}
                            </p>
                          )}

                          <div className="pt-2">
                            <Button
                              onClick={() => handleRequest(v.vid)}
                              className="w-full"
                            >
                              Request Appointment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination controls */}
              {vets.length > PER_PAGE && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button onClick={() => gotoPage(page - 1)} disabled={page === 1}>
                    Prev
                  </Button>

                  <div className="flex items-center gap-2">
                    {renderPageButtons()}
                  </div>

                  <Button onClick={() => gotoPage(page + 1)} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
