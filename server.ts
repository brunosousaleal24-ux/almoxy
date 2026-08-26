import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Corporate Engineering Backend API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      company: "Borges & Gomes Engenharia",
      system: "Sistema Integrado de Almoxarifado, Cautelas & Estoque",
      version: "2.4.0",
      timestamp: new Date().toISOString(),
      offlineSupport: "IndexedDB + Firestore Dual-Sync",
    });
  });

  app.get("/api/company", (req, res) => {
    res.json({
      tradeName: "Borges & Gomes Engenharia",
      corporateName: "Borges & Gomes Construções e Engenharia Ltda.",
      cnpj: "42.891.305/0001-92",
      headquarters: "Almoxarifado Central & Centro de Distribuição",
      sectors: [
        "Construção Civil & Estrutural",
        "Instalações Elétricas & Automação",
        "Instalações Hidráulicas & Sanitárias",
        "Segurança do Trabalho (SST) & EPIs",
        "Maquinários & Ferramentas Pesadas",
        "Acabamentos, Pintura & Impermeabilização",
        "Engenharia de Campo & Obras",
      ],
      activeWarehouses: [
        { id: "almox-central", name: "Almoxarifado Central (CD)", address: "Galpão Principal - Módulo A" },
        { id: "obra-skyline", name: "Obra Residencial Skyline Tower", address: "Canteiro de Obras 01" },
        { id: "obra-aurora", name: "Obra Comercial Aurora Plaza", address: "Canteiro de Obras 02" },
        { id: "galpao-sul", name: "Galpão de Maquinários & Logística Sul", address: "Base de Apoio Pesado" },
      ],
    });
  });

  app.post("/api/backup/validate", (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data.products)) {
        return res.status(400).json({ success: false, error: "Estrutura de dados de backup inválida." });
      }
      res.json({
        success: true,
        message: "Dados de backup validados com sucesso pela infraestrutura Borges & Gomes.",
        totalProducts: data.products.length,
        totalMovements: data.movements ? data.movements.length : 0,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Erro no processamento do backup." });
    }
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Borges & Gomes Engenharia] Servidor corporativo ativo na porta ${PORT}`);
  });
}

startServer();
