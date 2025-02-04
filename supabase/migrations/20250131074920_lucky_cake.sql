/*
  # Add INSERT policy for profiles table
  
  1. Changes
    - Add INSERT policy to allow authenticated users to create their own profile
  
  2. Security
    - Users can only create profiles with their own user ID
    - Maintains data integrity by enforcing user-profile relationship
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);