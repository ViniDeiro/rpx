import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import NovoProdutoForm from "@/components/admin/NovoProdutoForm"

export const metadata: Metadata = {
  title: "Adicionar Produto | RPX Admin",
  description: "Painel administrativo para adicionar novos produtos à loja",
}

export default function NovoProdutoPage() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/admin/loja" className="inline-flex">
          <Button variant="ghost" className="gap-1 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para lista de produtos</span>
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">Adicionar Novo Produto</h1>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo para adicionar um novo produto à loja
        </p>
      </div>
      
      <NovoProdutoForm />
    </div>
  )
} 