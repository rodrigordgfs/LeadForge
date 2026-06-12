import { redirect } from "next/navigation";

export default function BuscaPage() {
  redirect("/buscas?nova=1");
}
