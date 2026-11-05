import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronsUpDown } from "lucide-react";

export type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxSelectProps = {
  value: string;
  options: ComboboxOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
};

const ComboboxSelect = ({
  value,
  options,
  placeholder,
  onValueChange,
}: ComboboxSelectProps) => {
  const selectedOption =
    options.find((option) => option.value === value) || null;

  return (
    <Combobox.Root
      items={options}
      value={selectedOption}
      onValueChange={(option) => onValueChange(option?.value || "")}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(option, selected) => option.value === selected.value}
      autoHighlight
    >
      <div className="wb-combobox">
        <Combobox.Input
          className="wb-combobox-input"
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <Combobox.Trigger
          className="wb-combobox-trigger"
          aria-label="Open options"
        >
          <ChevronsUpDown size={16} aria-hidden="true" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="wb-combobox-positioner">
          <Combobox.Popup className="wb-combobox-popup">
            <Combobox.List>
              <Combobox.Collection>
                {(option, index) => (
                  <Combobox.Item
                    key={option.value}
                    index={index}
                    value={option}
                    className="wb-combobox-item"
                  >
                    <span>{option.label}</span>
                    <Combobox.ItemIndicator>
                      <Check size={14} aria-hidden="true" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.Collection>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

export default ComboboxSelect;
