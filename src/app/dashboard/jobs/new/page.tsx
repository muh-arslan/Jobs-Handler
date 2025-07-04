"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InputProps, TextareaProps, SelectProps } from "@/app/types/components";
import BackButton from '@/components/BackButton';
import LexicalEditor from '@/components/LexicalEditor';

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currencies, setCurrencies] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState({
        salaryExpected: "",
        salaryOffered: "",
    });
    const [errorModal, setErrorModal] = useState<{ message: string; visible: boolean }>({
        message: "",
        visible: false,
    });

    useEffect(() => {
        const fetchCurrencies = async () => {
            const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json");
            const data = await res.json();
            setCurrencies(data);
        };
        fetchCurrencies();
    }, []);


    const [form, setForm] = useState({
        company: "",
        jobTitle: "",
        platform: "",
        jobType: "Full-time",
        locationType: "Remote",
        jobLink: "",
        sharedExperience: "",
        actualExperience: "",
        resumeLink: "",
        appliedDate: new Date().toISOString().substring(0, 10),
        city: "",
        country: "",
        salaryOffered: "",
        salaryExpected: "",
        currency: "",
        status: "Applied",
        coverLetter: "",
        additionalInfo: "",
        isSalartPerAnnum: true,
        isActive: true,
    });

    const locationType = ['Remote', 'Onsite', 'Hybrid'];
    const jobTypes = ['Contract', 'Freelance', 'Part-time', 'Full-time'];
    const applicationStatus = ["Applied", "Pending", "Got Response", "Interviewed", "Offered", "Rejected by Company", "Rejected by Me", "Never heard back"];
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        // Salary validation & formatting
        if (name === "salaryExpected" || name === "salaryOffered") {
            const raw = value.replace(/,/g, "");
            if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                // Valid number, format with commas
                const formatted = Number(raw).toLocaleString();
                setForm({ ...form, [name]: formatted });
                setErrors({ ...errors, [name]: "" });
            } else {
                setErrors({ ...errors, [name]: "Please enter a valid number" });
            }
            return;
        }

        if (type === "checkbox" && e.target instanceof HTMLInputElement) {
            setForm({ ...form, [name]: e.target.checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredFields = [
            "company", "jobTitle", "platform", "jobType", "locationType", "jobLink", "sharedExperience",
            "actualExperience", "resumeLink", "appliedDate", "city", "country",
            "salaryOffered", "salaryExpected", "currency", "status"
        ];

        if (form.locationType === 'Remote') {
            const index = requiredFields.indexOf("city", 0);
            if (index > -1) {
                requiredFields.splice(index, 1);
            }
        }

        for (const field of requiredFields) {
            if (!form[field as keyof typeof form]?.toString().trim()) {
                setErrorModal({
                    message: `Please fill in the required field: ${field}`,
                    visible: true
                });
                return;
            }
        }

        if (errors.salaryExpected || errors.salaryOffered) {
            setErrorModal({
                message: "Please fix the salary field errors before submitting.",
                visible: true
            });
            return;
        }

        const cleanedForm = {
            ...form,
            salaryExpected: Number(form.salaryExpected.replace(/,/g, "")),
            salaryOffered: Number(form.salaryOffered.replace(/,/g, "")),
        };

        setLoading(true);
        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedForm),
            });

            if (!res.ok) {
                let message = "Something went wrong. Please try again.";

                try {
                    const data = await res.json();
                    message = data?.message || message;
                } catch {
                    message = "Server did not return a proper error message.";
                }

                throw new Error(message);
            }

            router.push("/dashboard/jobs");
        } catch (error: unknown) {
            let message = "Something went wrong. Please try again.";

            if (error instanceof Error) {
                message = error.message?.includes("validation")
                    ? "Please check your form — some values might be in the wrong format."
                    : error.message || message;
            }

            setErrorModal({
                message,
                visible: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <span className="flex items-center gap-2 mb-4">
                <BackButton fallback="/dashboard/jobs" />
                <h1 className="text-2xl font-bold">Add New Job Application</h1>
            </span>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Company Name" name="company" value={form.company} onChange={handleChange} required />
                    <div className="md:col-span-2">
                        <Input label="Job Title" name="jobTitle" value={form.jobTitle} onChange={handleChange} required />
                    </div>

                    <Input label="Platform Used" name="platform" value={form.platform} onChange={handleChange} required />
                    <Select label="Job Type" name="jobType" value={form.jobType} onChange={handleChange} options={jobTypes} />
                    <Select label="Location Type" name="locationType" value={form.locationType} onChange={handleChange} options={locationType} />

                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="currency">Currency</label>
                        <select
                            id="currency"
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            required
                            className="w-full border px-3 py-2 rounded-md shadow-sm bg-black text-white"
                        >
                            <option value="">Select Currency</option>
                            {Object.entries(currencies).map(([code, name]) => (
                                <option key={code} value={code.toUpperCase()}>
                                    {code.toUpperCase()} - {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div><Input label="Salary Offered" name="salaryOffered" value={form.salaryOffered} onChange={handleChange} required />
                        {errors.salaryOffered && <p className="text-red-500 text-sm mt-1">{errors.salaryOffered}</p>}
                    </div>
                    <div><Input label="Salary Expected" name="salaryExpected" value={form.salaryExpected} onChange={handleChange} required />
                        {errors.salaryExpected && <p className="text-red-500 text-sm mt-1">{errors.salaryExpected}</p>}
                    </div>
                    <Input label="City" name="city" value={form.city} onChange={handleChange} required={form.locationType !== "Remote"} />
                    <Input label="Country" name="country" value={form.country} onChange={handleChange} required />

                    <Input label="Applied Date" name="appliedDate" type="date" value={form.appliedDate} onChange={handleChange} required />
                </div>

                <Input label="Job Link" name="jobLink" type="url" value={form.jobLink} onChange={handleChange} required />
                <Input label="Resume Google Drive Link" name="resumeLink" type="url" value={form.resumeLink} onChange={handleChange} required />

                <Textarea label="Shared Experience" name="sharedExperience" value={form.sharedExperience} onChange={handleChange} required />
                <Textarea label="Actual Experience" name="actualExperience" value={form.actualExperience} onChange={handleChange} required />
                <Textarea label="Cover Letter (optional)" name="coverLetter" value={form.coverLetter} onChange={handleChange} />
                <LexicalEditor
                    label="Additional Information (optional)"
                    value={form.additionalInfo}
                    onChange={(value) => {
                        const cleaned = value.trim();
                        const isEmptyHtml = cleaned === '' || cleaned === '<p class="mb-0 relative"><br></p>';
                        handleChange({
                            target: {
                                name: 'additionalInfo',
                                value: isEmptyHtml ? '' : value,
                                type: 'text'
                            }
                        } as React.ChangeEvent<HTMLInputElement>);
                    }}
                />

                <Select label="Application Status" name="status" value={form.status} onChange={handleChange} options={applicationStatus} />

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isSalartPerAnnum" name="isSalartPerAnnum" checked={form.isSalartPerAnnum} onChange={handleChange} />
                    <label htmlFor="isSalartPerAnnum">Is Salary Per Annum?</label>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} />
                    <label htmlFor="isActive">Is Active?</label>
                </div>

                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    {loading ? "Submitting..." : "Add Job"}
                </button>
            </form>

            {errorModal.visible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-black rounded-lg p-6 shadow-lg max-w-md w-full border border-white">
                        <h2 className="text-white text-lg font-semibold mb-2">Error</h2>
                        <p className="text-sm text-white mb-4">{errorModal.message}</p>
                        <button
                            onClick={() => setErrorModal({ ...errorModal, visible: false })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable Input Component
function Input({ label, name, value, onChange, type = "text", required = false }: InputProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full border px-3 py-2 rounded-md shadow-sm"
            />
        </div>
    );
}

// Reusable Textarea Component
function Textarea({ label, name, value, onChange, required = false }: TextareaProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                required={required}
                className="w-full border px-3 py-2 rounded-md shadow-sm"
            />
        </div>
    );
}

// Reusable Select Component
function Select({ label, name, value, onChange, options }: SelectProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded-md shadow-sm bg-black text-white"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}
