import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    sa_id_number: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    suburb: "",
    city: "",
    province: "",
    postal_code: "",
    medical_aid_provider: "",
    medical_aid_number: "",
    medical_aid_plan: "",
    allergies: "",
    conditions: "",
    notes: "",
    consent_signed: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("patients")
        .insert([{
          ...formData,
          allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()) : [],
          conditions: formData.conditions ? formData.conditions.split(",").map(c => c.trim()) : [],
          consent_timestamp: formData.consent_signed ? new Date().toISOString() : null,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Patient created",
        description: "Patient record has been successfully created."
      });

      navigate(`/patients/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Patient</h1>
          <p className="text-muted-foreground">Create a new patient record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic patient details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sa_id_number">SA ID Number</Label>
                <Input
                  id="sa_id_number"
                  name="sa_id_number"
                  value={formData.sa_id_number}
                  onChange={handleChange}
                  placeholder="YYMMDDXXXXXX"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+27 XX XXX XXXX"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
            <CardDescription>Patient residential address for home visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete
              onAddressSelect={(address) => {
                setFormData(prev => ({
                  ...prev,
                  address_line1: address.address_line1,
                  suburb: address.suburb,
                  city: address.city,
                  province: address.province,
                  postal_code: address.postal_code
                }));
              }}
              disabled={loading}
            />
            
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                placeholder="Street address"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
                placeholder="Apartment, suite, etc."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suburb">Suburb</Label>
                <Input
                  id="suburb"
                  name="suburb"
                  value={formData.suburb}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="e.g., Gauteng"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="0000"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Aid Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Aid Information</CardTitle>
            <CardDescription>Patient medical aid and insurance details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medical_aid_provider">Provider</Label>
                <Input
                  id="medical_aid_provider"
                  name="medical_aid_provider"
                  value={formData.medical_aid_provider}
                  onChange={handleChange}
                  placeholder="e.g., Discovery"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_aid_number">Member Number</Label>
                <Input
                  id="medical_aid_number"
                  name="medical_aid_number"
                  value={formData.medical_aid_number}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_aid_plan">Plan</Label>
                <Input
                  id="medical_aid_plan"
                  name="medical_aid_plan"
                  value={formData.medical_aid_plan}
                  onChange={handleChange}
                  placeholder="e.g., Executive"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>Allergies, conditions, and clinical notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="Comma-separated: e.g., Penicillin, Peanuts"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions</Label>
              <Input
                id="conditions"
                name="conditions"
                value={formData.conditions}
                onChange={handleChange}
                placeholder="Comma-separated: e.g., Diabetes, Hypertension"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Additional clinical notes or observations"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consent */}
        <Card>
          <CardHeader>
            <CardTitle>Consent & Privacy</CardTitle>
            <CardDescription>POPIA compliance and patient consent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent_signed"
                checked={formData.consent_signed}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, consent_signed: checked as boolean }))
                }
                disabled={loading}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="consent_signed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Patient has provided informed consent
                </Label>
                <p className="text-sm text-muted-foreground">
                  I confirm that the patient has been informed about how their personal and medical 
                  information will be used, stored, and protected in accordance with POPIA regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/patients")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Patient
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewPatient;