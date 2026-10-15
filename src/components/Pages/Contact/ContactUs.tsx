"use client";

import { Form, Input } from "antd";
import Swal from "sweetalert2";
import {
  useGetPublicSettingQuery,
  useSubmitContactMutation,
} from "@/redux/features/settings/settingsApi";

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const ContactUs = () => {
  const [form] = Form.useForm<ContactFormValues>();
  const { data } = useGetPublicSettingQuery("about_us");
  const [submitContact, { isLoading }] = useSubmitContactMutation();

  const setting = data?.data;
  const metadata = setting?.metadata;
  const emails = metadata?.emails
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const address = metadata?.address;

  const onFinish = async (values: ContactFormValues) => {
    try {
      await submitContact(values).unwrap();
      form.resetFields();
      await Swal.fire({
        title: "Message sent",
        text: "Thank you for contacting us. We will get back to you soon.",
        icon: "success",
      });
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Could not send your message. Please try again.";
      await Swal.fire({
        title: "Oops!",
        text: message,
        icon: "error",
      });
    }
  };

  return (
    <div className="xl:container py-10 xl:pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:mb-20 ">
        <div>
          <h1 className="text-3xl font-semibold mb-4">
            {setting?.title || "Contact Us"}
          </h1>
          {setting?.content ? (
            <div
              className="policy-html mb-8 text-gray-700 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_a]:text-[#C1892F] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: setting.content }}
            />
          ) : (
            <p className="text-gray-600 mb-8">
              Send us a message and we will reply as soon as we can.
            </p>
          )}
          <div className="space-y-3 text-gray-700">
            {emails?.map((email) => (
              <p key={email}>
                <span className="font-semibold">Email:</span> {email}
              </p>
            ))}
            {address ? (
              <p>
                <span className="font-semibold">Address:</span> {address}
              </p>
            ) : null}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Name is required" },
              { max: 100, message: "Name must be 100 characters or less" },
            ]}
          >
            <Input size="large" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Valid email is required" },
            ]}
          >
            <Input size="large" placeholder="you@example.com" />
          </Form.Item>
          <Form.Item
            label="Subject"
            name="subject"
            rules={[
              { required: true, message: "Subject is required" },
              { max: 200, message: "Subject must be 200 characters or less" },
            ]}
          >
            <Input size="large" placeholder="How can we help?" />
          </Form.Item>
          <Form.Item
            label="Message"
            name="message"
            rules={[
              { required: true, message: "Message is required" },
              { max: 2000, message: "Message must be 2000 characters or less" },
            ]}
          >
            <Input.TextArea rows={6} placeholder="Write your message" />
          </Form.Item>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-sm bg-[#BF8D2F] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#a67809] disabled:opacity-60"
          >
            {isLoading ? "Sending…" : "Send Message"}
          </button>
        </Form>
      </div>
    </div>
  );
};

export default ContactUs;
