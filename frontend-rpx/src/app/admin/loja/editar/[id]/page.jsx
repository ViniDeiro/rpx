"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditarProdutoForm from "@/components/admin/EditarProdutoForm";

export default function EditarProdutoPage({ params }) {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/admin/loja" className="inline-flex">
          <Button variant="ghost" className="gap-1 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para lista de produtos</span>
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">Editar Produto</h1>
        <p className="text-muted-foreground">
          Atualize as informações do produto selecionado
        </p>
      </div>
      
      <EditarProdutoForm produtoId={params.id} />
    </div>
  );
} 