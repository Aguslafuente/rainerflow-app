import { HelpButton } from "@/components/HelpButton";
import { createClient } from "@/lib/supabase/server";
import { FoodLibrary } from "@/components/FoodLibrary";

export const dynamic = "force-dynamic";

export default async function AlimentosPage() {
  const supabase = createClient();

  const { data: foods } = await supabase
    .from("foods")
    .select("*")
    .order("category")
    .order("name");

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>Biblioteca de Alimentos</h1><HelpButton page="alimentos" /></div>
          <div className="sub">
            Base de datos nutricional para tus planes
          </div>
        </div>
      </div>
      <FoodLibrary initialFoods={foods ?? []} />
    </>
  );
}
