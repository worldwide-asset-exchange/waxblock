import { Autocomplete } from "@base-ui/react/autocomplete";
import { useMemo, useState } from "react";

export type AutocompleteItem = {
  value: string;
  label?: string;
};

type AutocompleteInputProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  value: string;
  items: AutocompleteItem[];
  defaultItems?: AutocompleteItem[];
  showDefaultItems?: boolean;
  className?: string;
  inputClassName?: string;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showBackdrop?: boolean;
  panelClassName?: string;
  triggerClassName?: string;
  closeClassName?: string;
  onClose?: () => void;
  onValueChange: (value: string) => void;
  onSelect: (item: AutocompleteItem) => void;
  onSubmit?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

const itemToString = (item: AutocompleteItem) => item.label || item.value;

const AutocompleteInput = ({
  id,
  name,
  placeholder,
  value,
  items,
  defaultItems = [],
  showDefaultItems = false,
  className,
  inputClassName,
  modal = false,
  open,
  onOpenChange,
  showBackdrop = false,
  panelClassName,
  triggerClassName,
  closeClassName,
  onClose,
  onValueChange,
  onSelect,
  onSubmit,
  onFocus,
  onBlur,
}: AutocompleteInputProps) => {
  const [highlightedItem, setHighlightedItem] = useState<
    AutocompleteItem | undefined
  >();
  const visibleItems = useMemo(
    () =>
      showDefaultItems && value === "" && items.length === 0
        ? defaultItems
        : items,
    [defaultItems, items, showDefaultItems, value],
  );
  const showPositioner = visibleItems.length > 0 || Boolean(modal && open);
  const showPortal = showPositioner || (showBackdrop && !modal);

  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const input = (
    <div
      className={`autocomplete ${className || ""}`}
      style={{ width: "100%" }}
    >
      <Autocomplete.Input
        id={id}
        name={name}
        className={inputClassName}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSubmit) {
            if (highlightedItem) {
              event.preventDefault();
              onSelect(highlightedItem);
              return;
            }
            onSubmit(value);
          }
        }}
      />
      {closeClassName ? (
        <button
          type="button"
          className={closeClassName}
          onClick={handleClose}
          aria-label="Close search"
        />
      ) : null}
    </div>
  );

  return (
    <Autocomplete.Root
      items={visibleItems}
      value={value}
      modal={modal}
      open={open}
      onOpenChange={onOpenChange}
      onValueChange={(nextValue, eventDetails) => {
        if (eventDetails.reason === "item-press") {
          const selectedItem = visibleItems.find(
            (item) => itemToString(item) === nextValue,
          );
          if (selectedItem) {
            onSelect(selectedItem);
            return;
          }
        }
        onValueChange(nextValue);
      }}
      itemToStringValue={itemToString}
      mode="none"
      autoHighlight={false}
      openOnInputClick
      onItemHighlighted={(item) => setHighlightedItem(item)}
    >
      {panelClassName ? (
        <div className={panelClassName}>{input}</div>
      ) : (
        input
      )}
      {triggerClassName ? (
        <Autocomplete.Trigger
          className={triggerClassName}
          aria-label="Open search"
        />
      ) : null}
      {showPortal ? (
        <Autocomplete.Portal>
          {showBackdrop && !modal ? (
            <Autocomplete.Backdrop className="search_backdrop" />
          ) : null}
          {showPositioner ? (
            <Autocomplete.Positioner
              sideOffset={0}
              className={`autocomplete-positioner${panelClassName ? " search-autocomplete-positioner" : ""}`}
            >
              {visibleItems.length > 0 ? (
                <Autocomplete.Popup className="autocomplete-items">
                  <Autocomplete.List>
                    {visibleItems.map((item, index) => (
                      <Autocomplete.Item
                        key={`${item.value}-${index}`}
                        index={index}
                        value={item}
                        onClick={() => onSelect(item)}
                      >
                        <span className="dropdown-item">
                          {item.label || item.value}
                        </span>
                      </Autocomplete.Item>
                    ))}
                  </Autocomplete.List>
                </Autocomplete.Popup>
              ) : null}
            </Autocomplete.Positioner>
          ) : null}
        </Autocomplete.Portal>
      ) : null}
    </Autocomplete.Root>
  );
};

export default AutocompleteInput;
