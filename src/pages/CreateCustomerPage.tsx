import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  FileText,
  Clock
} from 'lucide-react';
const API_URL="https://api.voylix.de";
export function CreateCustomerPage() {

  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    agencyId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    phone: '',
    email: '',
    createdAt: new Date().toISOString().split('T')[0],
    street: '',
    city: '',
    postalCode: '',
    country: '',
    companyName: '',
    companyStreet: '',
    companyCity: '',
    companyPostalCode: '',
    companyCountry: '',
    companyPhone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function getAgencyIdFromToken(token) {
    if (!token) return null;

    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    // نام claim بستگی به backend دارد
    return decoded.agencyId || decoded.AgencyId || decoded["agencyId"];
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);

    const token = localStorage.getItem("token");
    const agencyId = getAgencyIdFromToken(token);
    const payload = {
      AgencyId: agencyId,
      FirstName: formData.firstName,
      LastName: formData.lastName,
      DateOfBirth: formData.dateOfBirth,
      Nationality: formData.nationality,
      PassportNumber: formData.passportNumber,
      PassportExpiry: formData.passportExpiry,
      Phone: formData.phone,
      Email: formData.email,
      CreatedAt: formData.createdAt,
      Street: formData.street,
      City: formData.city,
      PostalCode: formData.postalCode,
      Country: formData.country,
      CompanyName: formData.companyName,
      CompanyStreet: formData.companyStreet,
      CompanyCity: formData.companyCity,
      CompanyPostalCode: formData.companyPostalCode,
      CompanyCountry: formData.companyCountry,
      CompanyPhone: formData.companyPhone
    };

    try {

      const res = await fetch(`${API_URL}/api/Customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        alert("خطا در ذخیره مشتری");
        return;
      }

      navigate('/customers');

    } catch (err) {
      console.error(err);
      alert("خطای شبکه");
    }
    finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-bold">Neuer Kunde</h1>
          <p className="text-sm text-zinc-500">Erfassen Sie die Daten eines neuen Kunden.</p>
        </div>
      </div>


      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User size={20} />
              Persönliche Informationen
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <input
              type="text"
              name="firstName"
              required
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              className="input"
            />

            <input
              type="text"
              name="lastName"
              required
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              className="input"
            />

            <input
              type="date"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="input"
            />

            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              placeholder="Nationality"
              className="input"
            />

            <input
              type="text"
              name="street"
              required
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Straße, Hausnummer"
              className="input"
            />

            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              className="input"
            />

            <input
              type="text"
              name="postalCode"
              required
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="PLZ"
              className="input"
            />

            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Land"
              className="input"
            />

          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User size={20} />
              Unternehmen Informationen
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <input
              type="text"
              name="companyName"
              placeholder="Firma Name"
              value={formData.companyName}
              onChange={handleInputChange}
              className="input"
            />

            <input
              type="text"
              name="companyStreet"
              value={formData.companyStreet}
              onChange={handleInputChange}
              placeholder="Straße, Hausnummer"
              className="input"
            />

            <input
              type="text"
              name="companyCity"
              value={formData.companyCity}
              onChange={handleInputChange}
              placeholder="Sdadt"
              className="input"
            />

            <input
              type="text"
              name="companyPostalCode"
              value={formData.companyPostalCode}
              onChange={handleInputChange}
              placeholder="PLZ"
              className="input"
            />

            <input
              type="text"
              name="companyCountry"
              value={formData.companyCountry}
              onChange={handleInputChange}
              placeholder="Land"
              className="input"
            />

            <input
              type="tel"
              name="companyPhone"
              value={formData.companyPhone}
              onChange={handleInputChange}
              placeholder="Phone"
              className="input"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText size={20} />
              Reisedokumente
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleInputChange}
              placeholder="Passport Number"
              className="input"
            />

            <input
              type="date"
              name="passportExpiry"
              value={formData.passportExpiry}
              onChange={handleInputChange}
              className="input"
            />

          </div>

        </div>


        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">

          <div className="p-6 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail size={20} />
              Kontaktinformationen
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone"
              className="input"
            />

            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="input"
            />

            <input
              type="date"
              name="createdAt"
              readOnly
              value={formData.createdAt}
              className="input opacity-70"
            />

          </div>

        </div>


        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border rounded-lg"
          >
            Abbrechen
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2 bg-emerald-600 text-white rounded-lg"
          >
            {isSaving ? "Saving..." : <Save size={18} />}
            Kunde speichern
          </button>

        </div>

      </form>
    </div>
  );
}