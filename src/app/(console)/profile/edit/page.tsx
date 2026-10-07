import type { Metadata } from "next";

import { PhotoPicker } from "@/components/profile/photo-picker";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireDoctor } from "@/lib/auth";
import { formatPhone, getCurrentDoctor } from "@/lib/doctor-view";
import { profilePercent } from "@/lib/profile-gaps";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  // The stored values (specialty keys, not labels) for the form, and the view for the photo.
  const [record, doctor] = await Promise.all([requireDoctor(), getCurrentDoctor()]);

  return (
    <ProfileForm
      initial={{
        name: record.name,
        qualifications: record.qualifications ?? "",
        experienceYears: record.experienceYears == null ? "" : String(record.experienceYears),
        about: record.about ?? "",
        specialties: record.specialties ?? [],
        languages: record.languages ?? [],
        state: record.state ?? "",
        city: record.city ?? "",
        council: record.council ?? "",
      }}
      locked={{
        phone: formatPhone(record.phone),
        registrationNumber: record.registrationNumber,
        council: record.council?.trim() ?? "",
      }}
      photo={<PhotoPicker photoUrl={doctor.photoUrl} initials={doctor.initials} />}
      progress={profilePercent(doctor.missing)}
    />
  );
}
