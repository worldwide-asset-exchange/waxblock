import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import AutocompleteInput, {
  AutocompleteItem,
} from "../../app/components/ui/AutocompleteInput";

const Search = () => {
  const [keywords, setKeywords] = useState("");
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobileSearch = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia("(max-width: 1027px)");
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 1027px)").matches,
    () => false,
  );
  const navigate = useNavigate();

  const initialItems = [
    { value: "eosio" },
    { value: "eosio.token" },
    { value: "eosio.vpay" },
  ];

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
    if (open) {
      requestAnimationFrame(() => {
        document.getElementById("dropdownMenuSearch")?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (keywords === "") return;

    const search_keywords = keywords.toLowerCase();

    const timeoutId = setTimeout(() => {
      BlockchainApiManager.getTableByScope({
        code: "eosio",
        table: "userres",
        lower_bound: search_keywords,
        upper_bound: search_keywords.padEnd(12, "z"),
        limit: 10,
      }).then((res) => {
        const nextItems = res.rows.map((row) => ({ value: row.scope }));
        setItems(nextItems);

        if (
          keywords.indexOf("eosio.") === -1 &&
          nextItems.length === 1
        ) {
          navigate(`account/${nextItems[0].value}`);
          setKeywords("");
          setSearchOpen(false);
        }
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [keywords, navigate]);

  const submitSearch = (value: string) => {
    if (!value) return;
    if (new RegExp("^[0-9]*$").test(value)) {
      navigate(`block/${value}`);
    } else if (new RegExp("^([a-z0-9]){60,}$", "i").test(value)) {
      navigate(`transaction/${value}`);
    } else if (
      new RegExp("^EOS([a-z0-9]){50,}$", "i").test(value) ||
      new RegExp("^PUB([a-z0-9_]){54,}$", "i").test(value)
    ) {
      navigate(`key/${value}`);
    } else if (new RegExp("^[a-z1-5.]*$", "i").test(value)) {
      navigate(`account/${value}`);
    } else {
      setItems([
        { value: "eosio" },
        { value: "eosio.token" },
        { value: "eosio.vpay" },
        { value: "eosio.msig" },
      ]);
    }
    setSearchOpen(false);
  };

  return (
    <AutocompleteInput
      id="dropdownMenuSearch"
      name="dropdownMenuSearch"
      placeholder="Search for account name, block, or transaction..."
      value={keywords}
      items={items}
      defaultItems={initialItems}
      showDefaultItems
      panelClassName={`search_box ${searchOpen ? "active" : ""}`}
      modal={isMobileSearch}
        open={isMobileSearch ? searchOpen : undefined}
        onOpenChange={isMobileSearch ? handleSearchOpenChange : undefined}
        showBackdrop={isMobileSearch}
        triggerClassName="open_search"
        closeClassName="close_search"
        onClose={() => handleSearchOpenChange(false)}
        onValueChange={setKeywords}
        onFocus={() => isMobileSearch && handleSearchOpenChange(true)}
        onBlur={() => {}}
        onSelect={(item) => {
          setKeywords(item.value);
          navigate(`/account/${item.value}`);
          setSearchOpen(false);
        }}
        onSubmit={submitSearch}
      />
  );
};

export default Search;
