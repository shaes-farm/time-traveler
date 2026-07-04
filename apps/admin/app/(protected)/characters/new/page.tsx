import { CharacterFormClient } from "../_components/character-form-client";

export const metadata = {
  title: "New character",
};

export default function NewCharacterPage() {
  return <CharacterFormClient mode="create" />;
}
