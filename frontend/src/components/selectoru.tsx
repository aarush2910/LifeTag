import { useId } from "react"

import { Label } from "../components/ui/label"
import { SelectNative } from "../components/ui/select-native"

export default function FarmType() {
  const id = useId()
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Farm Type</Label>
      <SelectNative id={id} className="bg-muted border-transparent shadow-none">
        <option value="1">Small</option>
        <option value="2">Medium</option>
        <option value="3">Large</option>

      </SelectNative>
    </div>
  )
}
