'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// special format for Zod to let zod know types and error messages using conditionals and coerce
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// 'async function that accepts formData
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };
   
export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }
   
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
   
    // Insert data into the database
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }
   
    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// create a formschema (skeleton) called update invoice which takes on the form of what is 
// expected in the form (including types) from above (see const FormSchema)
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// updateInvoice function called when attempting to update invoice: accepts invoice id, prev state of the form (if errors exist)
export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
) { 
    // use Zod for validation, parsing formdata into the UpdateInvoice format
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
   
    // check if the parsed validated fields succeeds. if not, return errors.
    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Update Invoice.',
        };
    }
    
    // success: set fields to the validateFields data
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    
    // try and update the table on the server using sql and a promise (async function allows other stuff to run in parallel)
    try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;
    } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
    }
    
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');

}