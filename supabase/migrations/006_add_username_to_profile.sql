ALTER TABLE public.profiles ADD username varchar(100);
ALTER TABLE public.profiles ADD CONSTRAINT username_length check (char_length(username) >= 3);

CREATE UNIQUE INDEX profiles_username_idx ON public.profiles (username);
