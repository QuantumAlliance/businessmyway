"use client";

import React, { useEffect, useMemo } from "react";
import { Form, Input, Select, Checkbox, ConfigProvider } from "antd";
import Swal from "sweetalert2";
import { LockOutlined } from "@ant-design/icons";
import ProductPhoto from "@/components/UI/ProductPhoto";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { isAdminRole } from "@/utils/role";
import { baseApi } from "@/redux/api/baseApi";
import { useGetProfileQuery } from "@/redux/features/Profile/Profile";
import { useCheckoutOrderMutation } from "@/redux/features/orders/orderApi";
import { cartApi, useClearCartMutation, useGetCartQuery } from "@/redux/features/cart/cartApi";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "@/utils/media";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Country, State, City } from "country-state-city";
import Autocomplete from "react-google-autocomplete";

import { useGetDeliveryQuery } from "@/redux/features/delivery/deliveryApi";
import { CiDeliveryTruck } from "react-icons/ci";
import { FiZap } from "react-icons/fi";

type CheckoutFormValues = {
  savedAddress?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  location?: string;
  address?: string;
  apartment?: string; 
  city?: string;
  province?: string;
  country?: string;
  postcode?: string;
  isDefaultAddress?: boolean;
};

const formatDefaultLocation = (profile?: {
  savedAddresses?: Array<{
    _id?: string;
    id?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    postcode?: string;
    isDefault?: boolean;
  }>;
}) => {
  const addresses = profile?.savedAddresses || [];
  const selected = addresses.find((address) => address.isDefault) || addresses[0];
  if (!selected) return "";
  return [selected.address1, selected.address2, selected.city, selected.province, selected.country, selected.postcode]
    .filter(Boolean)
    .join(", ");
};

const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const token = useAppSelector(selectToken);
  const cookieUser = useAppSelector(selectCurrentUser);
  const isAdmin = isAdminRole(cookieUser?.role);

  const [form] = Form.useForm<CheckoutFormValues>();
  const [selectedAddressMode, setSelectedAddressMode] = React.useState<string>("default");
  const [selectedAddressData, setSelectedAddressData] = React.useState<any>(null);
  const [mounted, setMounted] = React.useState(false);

  const [countryIso, setCountryIso] = React.useState<string>("");
  const [stateIso, setStateIso] = React.useState<string>("");

  const countryOptions = useMemo(() => {
    return Country.getAllCountries()
      .filter((c) => c.isoCode === "GB")
      .map((c) => ({
        value: c.name,
        label: c.name,
        isoCode: c.isoCode,
      }));
  }, []);

  const stateOptions = useMemo(() => {
    if (!countryIso) return [];
    return State.getStatesOfCountry(countryIso).map((s) => ({
      value: s.name,
      label: s.name,
      isoCode: s.isoCode,
    }));
  }, [countryIso]);

  const cityOptions = useMemo(() => {
    if (!countryIso || !stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [countryIso, stateIso]);

  const { data: profileData, isFetching: isProfileFetching } = useGetProfileQuery(undefined, { skip: !token || isAdmin });

  const [checkoutOrder, { isLoading }] = useCheckoutOrderMutation();
  const [clearCart] = useClearCartMutation();

  const { data: cartData, isFetching: isCartFetching } = useGetCartQuery(undefined, {
    skip: !token || isAdmin,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const cartItems = (cartData?.data || []).map((item: any) => ({
    ...item,
    image: resolveMediaUrl(item.image) || "",
  }));

  const profile = profileData?.data || cookieUser;

  const { data: deliveryData, isLoading: isDeliveryLoading } = useGetDeliveryQuery();
  const deliveryConfig = deliveryData?.data;

  const maximumPrice = Number(deliveryConfig?.maximumPrice ?? 200);
  const standardPrice = Number(deliveryConfig?.standardDelivery?.price ?? 4.99);
  const standardDay = deliveryConfig?.standardDelivery?.day || "3-5 Business Days";
  const expressPrice = Number(deliveryConfig?.expressDelivery?.price ?? 9.99);
  const expressDay = deliveryConfig?.expressDelivery?.day || "1-2 Business Days";

  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = React.useState<"standard" | "express">("standard");

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);

  // If subtotal is greater than or equal to maximumPrice (e.g. 200), delivery is FREE for both options
  const isFreeDelivery = subtotal >= maximumPrice;

  const deliveryFee = isFreeDelivery
    ? 0
    : selectedDeliveryMethod === "express"
    ? expressPrice
    : standardPrice;

  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (isAdmin) {
      router.push("/");
      return;
    }
  }, [token, isAdmin, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addresses = profile?.savedAddresses || [];
  const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];

  const addressOptions = useMemo(() => {
    const opts = addresses.map((addr: any, idx: number) => {
      const full = [addr.address1, addr.address2, addr.city, addr.country, addr.postcode].filter(Boolean).join(", ");
      return {
        value: addr._id || addr.id || String(idx),
        label: full || "Saved Address",
        data: addr,
      };
    });
    opts.push({ value: "new", label: "Use a new address", data: null });
    return opts;
  }, [addresses]);

  useEffect(() => {
    if (!profile) return;

    if (defaultAddress) {
      const defaultVal = defaultAddress._id || defaultAddress.id || "0";
      setSelectedAddressMode(defaultVal);
      setSelectedAddressData(defaultAddress);

      const initialCountry = defaultAddress.country || "United Kingdom";
      const initialProvince = defaultAddress.province || "";
      const cIso = Country.getAllCountries().find(x => x.name === initialCountry)?.isoCode || "";
      setCountryIso(cIso);
      if (cIso && initialProvince) {
        const pIso = State.getStatesOfCountry(cIso).find(x => x.name === initialProvince)?.isoCode || "";
        setStateIso(pIso);
      } else {
        setStateIso("");
      }

      form.setFieldsValue({
        savedAddress: defaultVal,
        firstName: defaultAddress.firstName || profile?.name?.split(" ")[0] || "",
        lastName: defaultAddress.lastName || profile?.name?.split(" ").slice(1).join(" ") || "",
        phone: defaultAddress.phone || profile?.phone || "",
        address: [defaultAddress.country, defaultAddress.province, defaultAddress.city, defaultAddress.postcode].filter(Boolean).join(", ") || "",
        apartment: defaultAddress.address2 || "",
        city: defaultAddress.city || "",
        province: initialProvince,
        country: initialCountry,
        postcode: defaultAddress.postcode || "",
        name: profile?.name || "",
        email: profile?.email || "",
        location: formatDefaultLocation(profile) || "",
      });
    } else {
      setSelectedAddressMode("new");
      setSelectedAddressData(null);
      setCountryIso("");
      setStateIso("");
      form.setFieldsValue({
        savedAddress: "new",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        apartment: "",
        city: undefined,
        province: undefined,
        country: undefined,
        postcode: "",
        name: profile?.name || "",
        email: profile?.email || "",
        location: "",
      });
    }
  }, [profile, defaultAddress, form]);

  useEffect(() => {
    if (selectedAddressMode !== "new" && selectedAddressData && (countryIso || stateIso)) {
      form.setFieldsValue({
        city: selectedAddressData.city || "",
        postcode: selectedAddressData.postcode || "",
      });
    }
  }, [countryIso, stateIso, selectedAddressMode, selectedAddressData, form]);

  const handleAddressChange = (value: string) => {
    setSelectedAddressMode(value);
    if (value === "new") {
      setSelectedAddressData(null);
      setCountryIso("");
      setStateIso("");
      form.setFieldsValue({
        savedAddress: "new",
        firstName: "",
        lastName: "",
        phone: "",
        name: profile?.name || "",
        email: profile?.email || "",
        location: "",
        address: "",
        apartment: "",
        city: undefined,
        province: undefined,
        country: undefined,
        postcode: "",
        isDefaultAddress: false,
      });
    } else {
      const selectedOpt = addressOptions.find((opt: any) => opt.value === value);
      if (selectedOpt && selectedOpt.data) {
        setSelectedAddressData(selectedOpt.data);

        const c = selectedOpt.data.country || "United Kingdom";
        const p = selectedOpt.data.province || "";
        const cIso = Country.getAllCountries().find(x => x.name === c)?.isoCode || "";
        setCountryIso(cIso);
        if (cIso && p) {
          const pIso = State.getStatesOfCountry(cIso).find(x => x.name === p)?.isoCode || "";
          setStateIso(pIso);
        } else {
          setStateIso("");
        }

        form.setFieldsValue({
          firstName: selectedOpt.data.firstName || profile?.name?.split(" ")[0] || "",
          lastName: selectedOpt.data.lastName || profile?.name?.split(" ").slice(1).join(" ") || "",
          address: selectedOpt.data.address1 || "", // ⭐ আপডেট করা হয়েছে
          apartment: selectedOpt.data.address2 || "", // ⭐ আপডেট করা হয়েছে
          city: selectedOpt.data.city || "",
          province: p,
          country: c,
          postcode: selectedOpt.data.postcode || "",
          phone: selectedOpt.data.phone || profile?.phone || "",
        });
      }
    }
  };

  const handlePlaceSelect = (place: any) => {
    let city = "";
    let province = "";
    let country = "";
    let postcode = "";
    let streetNumber = "";
    let route = "";
    let premise = "";
    let subpremise = "";

    place.address_components?.forEach((component: any) => {
      const types = component.types;

      if (types.includes("locality") || types.includes("postal_town")) {
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        province = component.long_name;
      }
      if (types.includes("country")) {
        country = component.long_name;
      }
      if (types.includes("postal_code")) {
        postcode = component.long_name;
      }
      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (types.includes("route")) {
        route = component.long_name;
      }
      if (types.includes("premise")) {
        premise = component.long_name;
      }
      if (types.includes("subpremise")) {
        subpremise = component.long_name;
      }
    });

    const streetAddressParts = [premise, subpremise, streetNumber, route].filter(Boolean);
    const address = streetAddressParts.length > 0 ? streetAddressParts.join(" ") : place.name || "";

    const countryObj = Country.getAllCountries().find(x => x.name.toLowerCase() === country.toLowerCase() || x.isoCode.toLowerCase() === country.toLowerCase());
    const cIso = countryObj?.isoCode || "";
    setCountryIso(cIso);
    
    if (cIso && province) {
      const stateObj = State.getStatesOfCountry(cIso).find(x => x.name.toLowerCase() === province.toLowerCase() || x.isoCode.toLowerCase() === province.toLowerCase());
      if (stateObj) {
        setStateIso(stateObj.isoCode);
        province = stateObj.name;
      } else {
        setStateIso("");
      }
    } else {
      setStateIso("");
    }

    if (city && cIso) {
      const stateToUse = State.getStatesOfCountry(cIso).find(x => x.name.toLowerCase() === province.toLowerCase() || x.isoCode.toLowerCase() === province.toLowerCase())?.isoCode || "";
      const cityObj = City.getCitiesOfState(cIso, stateToUse).find(x => x.name.toLowerCase() === city.toLowerCase());
      if (cityObj) {
        city = cityObj.name;
      }
    }

    form.setFieldsValue({
      address, 
      city,
      province: province || undefined,
      country: countryObj?.name || country || undefined,
      postcode,
    });
  };

  const emptyCartUi = () => {
    dispatch(
      cartApi.util.updateQueryData("getCart", undefined, (draft: any) => {
        draft.data = [];
      }),
    );
  };

  const onPay = async () => {
    if (isAdmin) {
      await Swal.fire({
        icon: "info",
        title: "Only customers",
        text: "Only customers can place orders.",
      });
      return;
    }
    try {
      const values = await form.validateFields();
      const result = await checkoutOrder({
        ...values,
        name: values.name || "",
        phone: values.phone || "",
        email: values.email || "",
        location: values.location || "",
        deliveryType: selectedDeliveryMethod,
        origin: window.location.origin,
      }).unwrap();
      emptyCartUi();
      try {
        await clearCart().unwrap();
      } catch {
        dispatch(baseApi.util.invalidateTags(["cart"]));
      }
      if (result.data?.orderId) {
        try {
          sessionStorage.setItem("lastOrderId", result.data.orderId);
        } catch {
          // ignore
        }
      }
      if (result.data?.url) {
        window.location.assign(result.data.url);
      }
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Could not start checkout. Please check your details and try again.";
      if ((error as { errorFields?: unknown })?.errorFields) return;
      await Swal.fire({
        icon: "error",
        title: "Checkout",
        text: message,
      });
    }
  };

  if (!mounted) return null;
  if (!token || isAdmin) return null;

  return (
    <div className="w-full xl:container mx-auto px-4 py-8 mt-10 mb-5 ">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <ConfigProvider theme={{ token: { colorPrimary: "#C1892F" } }}>
          <Form form={form} layout="vertical" requiredMark={false} initialValues={{ address: "", apartment: "", firstName: "", lastName: "", phone: "" }} className="border-2 border-[#E5E5E5] p-5 rounded-md flex flex-col">
            <h2 className="mb-4 text-xl font-medium text-[#1A1A1A]">Shipping address</h2>

            <Form.Item label="Saved addresses" name="savedAddress" className="mb-4">
              <Select
                className="w-full h-[42px] [&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-gray-300 hover:[&_.ant-select-selector]:!border-gray-400 focus:[&_.ant-select-selector]:!border-green-500 focus:[&_.ant-select-selector]:!ring-1 focus:[&_.ant-select-selector]:!ring-green-500"
                options={addressOptions}
                onChange={handleAddressChange}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-x-4 mb-4">
              <Form.Item label="First name" name="firstName" className="mb-0">
                <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
              </Form.Item>
              <Form.Item label="Last name" name="lastName" className="mb-0">
                <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-x-4 mb-4">
              <Form.Item label="Country/Region" name="country" className="mb-0" rules={[{ required: true, message: "Required" }]}>
                <Select
                  showSearch
                  className="w-full h-[42px] [&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-gray-300 hover:[&_.ant-select-selector]:!border-gray-400 focus:[&_.ant-select-selector]:!border-green-500 focus:[&_.ant-select-selector]:!ring-1 focus:[&_.ant-select-selector]:!ring-green-500"
                  options={countryOptions}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  onChange={(val, opt: any) => {
                    setCountryIso(opt.isoCode);
                    setStateIso("");
                    form.setFieldsValue({ province: undefined });
                  }}
                />
              </Form.Item>

              <Form.Item label="Province/State" name="province" className="mb-0">
                <Select
                  showSearch
                  disabled={!countryIso}
                  className="w-full h-[42px] [&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-gray-300 hover:[&_.ant-select-selector]:!border-gray-400 focus:[&_.ant-select-selector]:!border-green-500 focus:[&_.ant-select-selector]:!ring-1 focus:[&_.ant-select-selector]:!ring-green-500"
                  options={stateOptions}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  onChange={(val, opt: any) => {
                    setStateIso(opt.isoCode);
                  }}
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Address"
              name="address"
              className="mb-4"
            >
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                options={{
                  types: ["address"],
                  ...(countryIso && { componentRestrictions: { country: countryIso } })
                }}
                onPlaceSelected={handlePlaceSelect}
                className="w-full h-[42px] px-3 border border-gray-300 hover:border-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 rounded-sm text-base"
                onChange={(e: any) => form.setFieldsValue({ address: e.target.value })}
                placeholder=""
              />
            </Form.Item>

            <Form.Item label="Apartment, suite, etc. (optional)" name="apartment" className="mb-4">
              <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-x-4 mb-4">
              <Form.Item label="City" name="city" className="mb-0" rules={[{ required: true, message: "Required" }]}>
                <Select
                  showSearch
                  disabled={!stateIso}
                  className="w-full h-[42px] [&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-gray-300 hover:[&_.ant-select-selector]:!border-gray-400 focus:[&_.ant-select-selector]:!border-green-500 focus:[&_.ant-select-selector]:!ring-1 focus:[&_.ant-select-selector]:!ring-green-500"
                  options={cityOptions}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
              <Form.Item
                label="Postal/ZIP Code"
                name="postcode"
                className="mb-0"
                rules={[
                  { required: true, message: "Required" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      const c = getFieldValue("country");
                      if (c === "United Kingdom") {
                        const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
                        if (!ukPostcodeRegex.test(value)) {
                          return Promise.reject(new Error("Enter a valid postcode for the United Kingdom"));
                        }
                      }
                      return Promise.resolve();
                    }
                  })
                ]}
              >
                <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
              </Form.Item>
            </div>

            <Form.Item label="Phone" name="phone" className="mb-4">
              <PhoneInput
                country={'gb'}
                containerClass="w-full"
                inputClass="!w-full !border-gray-300 focus:!border-green-500 focus:!ring-1 focus:!ring-green-500 !h-[42px] !text-base !rounded-sm"
                buttonClass="!border-gray-300 !bg-gray-50 !rounded-l-sm"
                dropdownClass="!w-[300px]"
              />
            </Form.Item>

            {selectedAddressMode === "new" && (
              <Form.Item name="isDefaultAddress" valuePropName="checked" className="mb-0 mt-2">
                <Checkbox className="text-[#1A1A1A]">This is my default address</Checkbox>
              </Form.Item>
            )}
          </Form>
        </ConfigProvider>

        <div className="flex flex-col gap-6">
          {/* Delivery Method Selection Card */}
          <div className="rounded-md border border-[#EDEDED] bg-[#FAFAF8] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CiDeliveryTruck size={24} className="text-[#BF8D2F]" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]">Delivery method</h3>
              </div>
              {isFreeDelivery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  ✓ Free Delivery Applied
                </span>
              )}
            </div>

            {isDeliveryLoading ? (
              <p className="text-sm text-gray-500 py-3">Loading delivery options...</p>
            ) : (
              <>
                {isFreeDelivery ? (
                  <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                    🎉 Congratulations! Your order is over £{maximumPrice.toFixed(2)}, so delivery is completely <span className="font-bold">FREE</span>!
                  </div>
                ) : subtotal > 0 ? (
                  <div className="mb-4 rounded-md bg-[#BF8D2F]/10 border border-[#BF8D2F]/30 p-3 text-xs text-[#8A6A24]">
                    💡 Add <span className="font-bold text-[#1A1A1A]">£{(maximumPrice - subtotal).toFixed(2)}</span> more to your cart to qualify for <span className="font-bold text-[#BF8D2F]">FREE delivery</span> (Threshold: £{maximumPrice.toFixed(2)})!
                  </div>
                ) : null}

                <div className="space-y-3">
                  {/* Standard Delivery Option */}
                  <div
                    onClick={() => setSelectedDeliveryMethod("standard")}
                    className={`flex items-center justify-between p-3.5 rounded-md border-2 cursor-pointer transition-all ${
                      selectedDeliveryMethod === "standard"
                        ? "border-[#BF8D2F] bg-[#BF8D2F]/5 shadow-sm"
                        : "border-[#E5E5E5] hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="delivery_standard"
                        name="deliveryMethod"
                        checked={selectedDeliveryMethod === "standard"}
                        onChange={() => setSelectedDeliveryMethod("standard")}
                        className="accent-[#BF8D2F] w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="delivery_standard" className="cursor-pointer">
                        <p className="font-medium text-[#1A1A1A] text-sm">Standard Delivery</p>
                        <p className="text-xs text-gray-500">{standardDay}</p>
                      </label>
                    </div>
                    <div className="text-right">
                      {isFreeDelivery ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 line-through">£{standardPrice.toFixed(2)}</span>
                          <span className="text-sm font-bold text-emerald-600">FREE</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-[#1A1A1A]">£{standardPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Express Delivery Option */}
                  <div
                    onClick={() => setSelectedDeliveryMethod("express")}
                    className={`flex items-center justify-between p-3.5 rounded-md border-2 cursor-pointer transition-all ${
                      selectedDeliveryMethod === "express"
                        ? "border-[#BF8D2F] bg-[#BF8D2F]/5 shadow-sm"
                        : "border-[#E5E5E5] hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="delivery_express"
                        name="deliveryMethod"
                        checked={selectedDeliveryMethod === "express"}
                        onChange={() => setSelectedDeliveryMethod("express")}
                        className="accent-[#BF8D2F] w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="delivery_express" className="cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-[#1A1A1A] text-sm">Express Delivery</p>
                          <span className="flex items-center gap-0.5 rounded bg-[#BF8D2F]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#BF8D2F]">
                            <FiZap size={10} /> Fast
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{expressDay}</p>
                      </label>
                    </div>
                    <div className="text-right">
                      {isFreeDelivery ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 line-through">£{expressPrice.toFixed(2)}</span>
                          <span className="text-sm font-bold text-emerald-600">FREE</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-[#1A1A1A]">£{expressPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-md border border-[#EDEDED] bg-[#FAFAF8] p-5 h-fit">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]">
              Order summary
            </h3>

        {isCartFetching ? (
          <p className="text-sm text-gray-500 py-4">Loading cart...</p>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-[#E5E5E5] bg-white">
                  <ProductPhoto src={item.image} alt={item.title} className="h-full w-full object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                  <p className="text-xs text-gray-500">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] shrink-0">
                  £{(item.price * item.qty).toFixed(2)}
                </p>
              </div>
            ))}
            {cartItems.length === 0 && (
              <p className="text-sm text-gray-500">Your cart is empty.</p>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-[#E5E5E5] pt-4 text-sm">
          <div className="flex justify-between text-[#1A1A1A]">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#1A1A1A]">
            <span>
              {selectedDeliveryMethod === "express" ? "Express Delivery" : "Standard Delivery"}
            </span>
            <span>
              {isFreeDelivery ? (
                <span className="font-semibold text-emerald-600">FREE</span>
              ) : (
                `£${deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#E5E5E5]">
            <span className="font-semibold text-[#1A1A1A]">Total</span>
            <span className="text-lg font-bold text-[#BF8D2F]">£{total.toFixed(2)}</span>
          </div>
        </div>
          

          <button
            type="button"
            onClick={onPay}
            disabled={isLoading || isProfileFetching || cartItems.length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-[#BF8D2F] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <LockOutlined />
            {isLoading ? "Redirecting to Viva Payments..." : "Pay securely with Viva Payments"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">
            You will be redirected to Viva Payments to complete payment.
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default CheckoutPage;
