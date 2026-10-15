"use client";

import { Form, Input, Checkbox, ConfigProvider, Select, Spin, AutoComplete } from "antd";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { useUpdateAddressMutation, useGetProfileQuery, type SavedAddressPayload, type SavedAddress } from "@/redux/features/Profile/Profile";
import { Country, State } from "country-state-city";
import { useState, useMemo, useEffect } from "react";
import Autocomplete from "react-google-autocomplete";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getCityOptions } from "@/constants/locations";

type AddressFormValues = SavedAddressPayload;

const EditAddressPage = () => {
  const [form] = Form.useForm<AddressFormValues>();
  const router = useRouter();
  const params = useParams();
  const addressId = params.id as string;

  const { data, isLoading: isLoadingProfile } = useGetProfileQuery({});
  const [updateAddress, { isLoading }] = useUpdateAddressMutation();

  const [countryIso, setCountryIso] = useState<string>("GB");
  const [stateIso, setStateIso] = useState<string>("");

  useEffect(() => {
    if (data?.data?.savedAddresses) {
      const address = data.data.savedAddresses.find((a: SavedAddress) => a.id === addressId || (a as any)._id === addressId);
      if (address) {
        form.setFieldsValue({
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company,
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          country: address.country,
          province: address.province,
          postcode: address.postcode,
          phone: address.phone,
          isDefault: address.isDefault,
        });

        const cIso = Country.getAllCountries().find(x => x.name === address.country)?.isoCode || "GB";
        setCountryIso(cIso);
        if (cIso && address.province) {
          const pIso = State.getStatesOfCountry(cIso).find(x => x.name === address.province)?.isoCode || "";
          setStateIso(pIso);
        } else {
          setStateIso("");
        }
      }
    }
  }, [data, addressId, form]);

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
    const iso = countryIso || "GB";
    return State.getStatesOfCountry(iso).map((s) => ({
      value: s.name,
      label: s.name,
      isoCode: s.isoCode,
    }));
  }, [countryIso]);

  const cityOptions = useMemo(() => {
    return getCityOptions(countryIso || "GB", stateIso);
  }, [countryIso, stateIso]);

  const onFinish = async (values: AddressFormValues) => {
    try {
      const payload = {
        label: values.label?.trim() || "Home",
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        company: values.company?.trim() || "",
        address1: values.address1.trim(),
        address2: values.address2?.trim() || "",
        city: values.city.trim(),
        country: values.country.trim(),
        province: values.province?.trim() || "",
        postcode: values.postcode?.trim() || "",
        phone: values.phone.trim(),
        isDefault: Boolean(values.isDefault),
      };

      const response: any = await updateAddress({ id: addressId, ...payload }).unwrap();
      if (response.success) {
        Swal.fire({
          title: "Updated",
          text: "Address updated successfully.",
          icon: "success",
        });
        router.push("/addresses");
      }

    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || "Failed to save address.";
      Swal.fire({ title: "Error", text: message, icon: "error" });
    }
  };

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">
          <span className="text-[#1f2a44]">Edit </span>
          <span className="text-[#c98a3e]">Address</span>
        </h1>
      </div>

      {isLoadingProfile && (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin />
        </div>
      )}

      <div className={`max-w-3xl rounded-md border border-gray-300 p-6 bg-white ${isLoadingProfile ? 'hidden' : 'block'}`}>
        <ConfigProvider theme={{ token: { colorPrimary: "#C1892F" } }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Form.Item
                label="First name"
                name="firstName"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
              </Form.Item>
              <Form.Item
                label="Last name"
                name="lastName"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
              </Form.Item>
            </div>

            <Form.Item label="Company" name="company">
              <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
            </Form.Item>

            <Form.Item
              label="Address 1"
              name="address1"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
            </Form.Item>

            <Form.Item label="Address 2" name="address2">
              <Input className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm" />
            </Form.Item>

            <Form.Item
              label="Country/region"
              name="country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                showSearch
                placeholder="Select a country"
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

            <Form.Item label="Province/State" name="province">
              <Select
                showSearch
                placeholder="Select a province/state"
                disabled={!countryIso}
                className="w-full h-[42px] [&_.ant-select-selector]:!rounded-sm [&_.ant-select-selector]:!border-gray-300 hover:[&_.ant-select-selector]:!border-gray-400 focus:[&_.ant-select-selector]:!border-green-500 focus:[&_.ant-select-selector]:!ring-1 focus:[&_.ant-select-selector]:!ring-green-500"
                options={stateOptions}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                onChange={(val, opt: any) => {
                  setStateIso(opt?.isoCode || "");
                }}
              />
            </Form.Item>

            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: "Required" }]}
            >
              <AutoComplete
                options={cityOptions}
                filterOption={(inputValue, option) =>
                  (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                <Input
                  placeholder="Select or enter city"
                  className="h-[42px] border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500 rounded-sm"
                />
              </AutoComplete>
            </Form.Item>

            <Form.Item label="Postal/ZIP code" name="postcode">
              <Autocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                options={{
                  types: ["postal_code"],
                  ...(countryIso && { componentRestrictions: { country: countryIso } })
                }}
                onPlaceSelected={(place) => {
                  const postcode = place.name || "";
                  form.setFieldsValue({ postcode });
                }}
                className="w-full h-[42px] px-3 border border-gray-300 hover:border-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 rounded-sm"
                defaultValue={form.getFieldValue("postcode")}
                onChange={(e: any) => form.setFieldsValue({ postcode: e.target.value })}
              />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[{ required: true, message: "Required" }]}
            >
              <PhoneInput
                country={'gb'}
                containerClass="w-full"
                inputClass="!w-full !border-gray-300 focus:!border-green-500 focus:!ring-1 focus:!ring-green-500 !h-[42px] !text-base !rounded-sm"
                buttonClass="!border-gray-300 !bg-gray-50 !rounded-l-sm"
                dropdownClass="!w-[300px]"
              />
            </Form.Item>

            <Form.Item
              name="isDefault"
              valuePropName="checked"
            >
              <Checkbox className="text-gray-700">Set as default address</Checkbox>
            </Form.Item>

            <div className="flex items-center gap-4 mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-[3px] bg-[#198754] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#157347] disabled:opacity-60"
              >
                {isLoading ? "Saving..." : "Update address"}
              </button>
              <button
                type="button"
                onClick={() => router.push('/addresses')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default EditAddressPage;
