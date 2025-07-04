'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Job } from '@/types/job';
import { JobApplicationSetting } from '@/app/types/jobAppSettings';
import { FaLink } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import BackButton from '@/components/BackButton';
import ToggleSwitch from '@/components/ToggleSwitch';
import RichTextViewer from '@/components/RichTextViewer';

const JobDetailPage = () => {
    const params = useParams();
    const id = params.id as string;
    const [job, setJob] = useState<Job | null>(null);
    const [updating, setUpdating] = useState(false);

    const [settings, setSettings] = useState<JobApplicationSetting | null>(null);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/jobs/${id}`)
                .then((res) => res.json())
                .then((data) => setJob(data))
                .catch((error) => console.error('Error fetching job:', error));
        }
        fetchSettings();
    }, [id]);

    const fetchExchangeRate = useCallback(async () => {
        try {
            if (!job?.currency || !settings?.localCurrency) return;

            const from = job.currency.toLowerCase();
            const to = settings.localCurrency.toLowerCase();
            const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`);
            const data = await res.json();
            const rate = data[from]?.[to];

            if (rate) setExchangeRate(rate);
        } catch (error) {
            console.error("Failed to fetch exchange rate:", error);
        }
    }, [job?.currency, settings?.localCurrency]);

    useEffect(() => {
        if (settings?.convertCurrency && settings.localCurrency?.toLowerCase() !== job?.currency?.toLowerCase()) {
            fetchExchangeRate();
        }
    }, [settings, job, fetchExchangeRate]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings/job-application");
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const updateField = async (field: string, value: Job[keyof Job]) => {
        if (!job) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/jobs/${job._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            const updated = await res.json();
            setJob(updated);
        } catch (error) {
            console.error('Update error:', error);
        } finally {
            setUpdating(false);
        }
    };


    const updateActiveToggle = async () => {
        if (!job) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/jobs/${job._id}/toggle`, {
                method: 'PATCH',
            });
            const updated = await res.json();
            setJob(updated);
        } catch (error) {
            console.error("Toggle update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const formatConvertedSalaryDisplay = (
        type: "offered" | "expected"
    ): { label: string; value: string } | null => {
        if (!settings?.convertCurrency || !job || !settings.localCurrency) return null;

        const salary = type === "offered" ? job.salaryOffered : job.salaryExpected;
        const sameCurrency = settings.localCurrency.toLowerCase() === job.currency.toLowerCase();

        // Same currency logic
        if (sameCurrency) {
            if (job.isSalartPerAnnum) {
                const monthly = Math.round(salary / 12);
                return {
                    label: `Salary ${type === "offered" ? "Offered" : "Expected"} in ${settings.localCurrency}/Month`,
                    value: `${monthly.toLocaleString()} ${settings.localCurrency}`
                };
            } else {
                const annual = salary * 12;
                return {
                    label: `Salary ${type === "offered" ? "Offered" : "Expected"} in ${settings.localCurrency}/Annum`,
                    value: `${annual.toLocaleString()} ${settings.localCurrency}`
                };
            }
        }

        // Different currency: always convert monthly
        if (!exchangeRate) return null;
        const monthly = job.isSalartPerAnnum ? salary / 12 : salary;
        const converted = Math.round(monthly * exchangeRate);
        return {
            label: `Salary ${type === "offered" ? "Offered" : "Expected"} in ${settings.localCurrency}/Month`,
            value: `${converted.toLocaleString()} ${settings.localCurrency}`
        };
    };

    if (!job) return <div className="p-6 text-center">Loading job details...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <BackButton fallback="/dashboard/jobs" />
                <h1 className="text-3xl font-bold">{job.jobTitle}</h1>
            </div>

            {/* Main Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow rounded-lg p-6 border">
                <Info label="Company" value={job.company} />
                <Info label="Platform" value={job.platform} />
                <Info label="Job Type" value={job.jobType} />
                <Info label="Location Type" value={job.locationType} />
                <Info label="Location" value={
                    job.city
                        ? `${job.city}, ${job.country}`
                        : job.country
                } />
                <Info label="Applied Date" value={new Date(job.appliedDate).toLocaleDateString()} />
                <Info label="Salary Offered" value={`${Number(job.salaryOffered).toLocaleString()} ${job.currency}`} />
                <Info label="Salary Expected" value={`${Number(job.salaryExpected).toLocaleString()} ${job.currency}`} />

                {/* Conditionally render converted salaries */}
                {settings?.convertCurrency && (
                    <>
                        {formatConvertedSalaryDisplay("offered") && (
                            <Info
                                label={formatConvertedSalaryDisplay("offered")!.label}
                                value={formatConvertedSalaryDisplay("offered")!.value}
                            />
                        )}
                        {formatConvertedSalaryDisplay("expected") && (
                            <Info
                                label={formatConvertedSalaryDisplay("expected")!.label}
                                value={formatConvertedSalaryDisplay("expected")!.value}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Status & Active Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow rounded-lg p-6 border">
                <div className="flex flex-col">
                    <label className="text-sm font-medium">Job Status</label>
                    <select
                        className="border rounded p-2 mt-1 text-sm bg-black text-white"
                        value={job.status}
                        disabled={updating}
                        onChange={(e) => updateField('status', e.target.value)}
                    >
                        {["Applied", "Pending", "Got Response", "Interviewed", "Offered", "Rejected by Company", "Rejected by Me", "Never heard back"].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <ToggleSwitch
                    label="Active"
                    checked={job.isActive}
                    onChange={updateActiveToggle}
                    disabled={updating}
                />
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow rounded-lg p-6 border">
                <InfoLinks label="Resume Link" value={<a href={job.resumeLink} target="_blank"><ImProfile /></a>} />
                <InfoLinks label="Job Link" value={<a href={job.jobLink} target="_blank"><FaLink /></a>} />
            </div>

            {/* Experience Section */}
            <div className=" shadow rounded-lg p-6 border space-y-2">
                <h2 className="text-lg font-semibold">Experience</h2>
                <p><strong>Shared Experience:</strong> {job.sharedExperience}</p>
                <p><strong>Actual Experience:</strong> {job.actualExperience}</p>
                <p><strong>Salary Per Annum:</strong> {job.isSalartPerAnnum ? 'Yes' : 'No'}</p>
            </div>

            {/* Cover Letter */}
            {job.coverLetter &&
                <div className=" shadow rounded-lg p-6 border space-y-2">
                    <h2 className="text-lg font-semibold">Cover Letter</h2>
                    <p>{job.coverLetter}</p>
                </div>}

            {/* Additional Information */}
            {job.additionalInfo &&
                <div className="shadow rounded-lg p-6 border space-y-2">
                    <h2 className="text-lg font-semibold">Additional Information</h2>
                    <RichTextViewer content={job.additionalInfo} />
                </div>}
        </div>
    );
};

// Reusable Info Component
const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-sm">{label}</p>
        <p className="font-medium">{value}</p>
    </div>
);

const InfoLinks = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className='flex items-center gap-10'>
        <p className="text-sm">{label}</p>
        <p className="font-medium">{value}</p>
    </div>
);

export default JobDetailPage;
