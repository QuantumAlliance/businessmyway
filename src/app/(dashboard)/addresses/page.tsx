"use client";

import { Spin } from "antd";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
  useGetProfileQuery,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  type SavedAddress,
} from "@/redux/features/Profile/Profile";


const AddressCard = ({
  address,
  onEdit,
  onRemove,
  onSetDefault,
}: {
  address: SavedAddress;
  onEdit: (address: SavedAddress) => void;
  onRemove: (address: SavedAddress) => void;
  onSetDefault: (address: SavedAddress) => void;
}) => {
  return (
    <div className="relative flex-1 rounded-md border border-gray-300 p-5">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-serif text-lg font-bold text-[#c98a3e]">
          {address.firstName} {address.lastName}
        </h3>
        {address.isDefault && (
          <span className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700">
            Default
          </span>
        )}
      </div>

      <div className="mb-5 text-sm leading-6 text-gray-800">
        {address.company ? <p>{address.company}</p> : null}
        <p>{address.address1}</p>
        {address.address2 ? <p>{address.address2}</p> : null}
        <p>
          {address.city}, {address.province ? `${address.province} ` : ""}
          {address.postcode}
        </p>
        <p>{address.country}</p>
        <p>{address.phone}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-700">
        <button type="button" onClick={() => onEdit(address)} className="underline hover:text-gray-900">
          Edit
        </button>
        {!address.isDefault && (
          <>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={() => onSetDefault(address)} className="hover:text-gray-900">
              Set Default
            </button>
          </>
        )}
        <span className="text-gray-300">|</span>
        <button type="button" onClick={() => onRemove(address)} className="hover:text-gray-900">
          Remove
        </button>
      </div>
    </div>
  );
};

const Page = () => {
  const router = useRouter();
  const { data, isLoading } = useGetProfileQuery({});
  const [removeAddress] = useRemoveAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const profile = data?.data;
  const addresses: SavedAddress[] = profile?.savedAddresses || [];

  const openAddModal = () => {
    router.push("/addresses/add");
  };

  const openEditModal = (address: SavedAddress) => {
    router.push(`/addresses/edit/${address.id || (address as any)._id}`);
  };



  const handleRemove = async (address: SavedAddress) => {
    const confirmed = await Swal.fire({
      title: "Remove address?",
      text: `${address.label} will be removed from your profile.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C1892F",
      cancelButtonColor: "#8A8174",
      confirmButtonText: "Remove",
    });
    if (!confirmed.isConfirmed) return;
    try {
      await removeAddress(address.id).unwrap();
      Swal.fire({ title: "Removed", text: "Address removed successfully.", icon: "success" });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || "Failed to remove address.";
      Swal.fire({ title: "Error", text: message, icon: "error" });
    }
  };

  const handleSetDefault = async (address: SavedAddress) => {
    try {
      await setDefaultAddress(address.id).unwrap();
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || "Failed to set default address.";
      Swal.fire({ title: "Error", text: message, icon: "error" });
    }
  };

  return (
    <div className="py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">
          <span className="text-[#1f2a44]">Personal </span>
          <span className="text-[#c98a3e]">Details</span>
        </h1>
        {/* <GifRevealWrapper borderSize={3}> */}
        <button
          type="button"
          onClick={openAddModal}
          className="h-[40px] w-[200px] rounded-sm bg-[#BF8D2F] px-2 font-medium text-white transition-colors hover:bg-[#a97922] md:w-[180px] lg:w-[200px] lg:px-[10px] lg:py-[10px]"
        >
          Add New Address
        </button>
        {/* </GifRevealWrapper> */}
      </div>

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <Spin />
        </div>
      ) : addresses.length === 0 ? (
        <p className="mt-6 rounded-md border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          No saved addresses yet. Add one to your profile.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={openEditModal}
              onRemove={handleRemove}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}


    </div>
  );
};

export default Page;
